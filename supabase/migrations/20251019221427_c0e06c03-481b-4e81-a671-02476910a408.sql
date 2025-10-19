-- Adicionar campo saldo_em_saque na carteira
ALTER TABLE carteira ADD COLUMN IF NOT EXISTS saldo_em_saque numeric DEFAULT 0;

-- Atualizar trigger de criação de saques para bloquear o valor
CREATE OR REPLACE FUNCTION public.processar_solicitacao_saque()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_montador_user_id uuid;
  v_saldo_disponivel numeric;
BEGIN
  -- Buscar user_id do montador e saldo disponível
  SELECT m.user_id, c.saldo_disponivel
  INTO v_montador_user_id, v_saldo_disponivel
  FROM montadores m
  JOIN carteira c ON c.montador_id = m.id
  WHERE m.id = NEW.montador_id;

  -- Verificar se tem saldo suficiente
  IF v_saldo_disponivel < NEW.valor THEN
    RAISE EXCEPTION 'Saldo insuficiente para saque';
  END IF;

  -- Transferir de disponível para em_saque
  UPDATE carteira 
  SET 
    saldo_disponivel = saldo_disponivel - NEW.valor,
    saldo_em_saque = saldo_em_saque + NEW.valor
  WHERE montador_id = NEW.montador_id;

  -- Registrar transação
  INSERT INTO carteira_transacoes (
    carteira_id, tipo, valor, descricao
  ) 
  SELECT id, 'saque_solicitado', NEW.valor, 'Saque solicitado - Aguardando aprovação'
  FROM carteira WHERE montador_id = NEW.montador_id;

  -- Notificar montador
  INSERT INTO notificacoes (user_id, tipo, mensagem)
  VALUES (
    v_montador_user_id,
    'saque',
    'Solicitação de saque de R$ ' || NEW.valor::text || ' enviada. Aguardando aprovação do administrador.'
  );

  RETURN NEW;
END;
$function$;

-- Criar trigger para processar saque
DROP TRIGGER IF EXISTS trigger_processar_saque ON saques;
CREATE TRIGGER trigger_processar_saque
  AFTER INSERT ON saques
  FOR EACH ROW
  EXECUTE FUNCTION processar_solicitacao_saque();

-- Função para aprovar saque
CREATE OR REPLACE FUNCTION public.aprovar_saque(p_saque_id uuid, p_admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_valor numeric;
  v_montador_id uuid;
  v_montador_user_id uuid;
  v_carteira_id uuid;
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = p_admin_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas admins podem aprovar saques';
  END IF;

  -- Buscar dados do saque
  SELECT s.valor, s.montador_id, m.user_id
  INTO v_valor, v_montador_id, v_montador_user_id
  FROM saques s
  JOIN montadores m ON s.montador_id = m.id
  WHERE s.id = p_saque_id AND s.status = 'solicitado';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Saque não encontrado ou já processado';
  END IF;

  -- Buscar carteira
  SELECT id INTO v_carteira_id FROM carteira WHERE montador_id = v_montador_id;

  -- Atualizar status do saque
  UPDATE saques 
  SET 
    status = 'aprovado',
    processed_by = p_admin_user_id,
    updated_at = now()
  WHERE id = p_saque_id;

  -- Atualizar carteira (remover de em_saque e adicionar ao total_sacado)
  UPDATE carteira
  SET 
    saldo_em_saque = saldo_em_saque - v_valor,
    total_sacado = total_sacado + v_valor
  WHERE id = v_carteira_id;

  -- Registrar transação
  INSERT INTO carteira_transacoes (
    carteira_id, tipo, valor, descricao, processed_by
  ) VALUES (
    v_carteira_id, 'saque_aprovado', v_valor, 
    'Saque aprovado pelo admin', p_admin_user_id
  );

  -- Notificar montador
  INSERT INTO notificacoes (user_id, tipo, mensagem)
  VALUES (
    v_montador_user_id,
    'saque',
    'Saque de R$ ' || v_valor::text || ' foi aprovado e processado!'
  );

  RETURN true;
END;
$function$;

-- Função para recusar saque
CREATE OR REPLACE FUNCTION public.recusar_saque(p_saque_id uuid, p_admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_valor numeric;
  v_montador_id uuid;
  v_montador_user_id uuid;
  v_carteira_id uuid;
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = p_admin_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas admins podem recusar saques';
  END IF;

  -- Buscar dados do saque
  SELECT s.valor, s.montador_id, m.user_id
  INTO v_valor, v_montador_id, v_montador_user_id
  FROM saques s
  JOIN montadores m ON s.montador_id = m.id
  WHERE s.id = p_saque_id AND s.status = 'solicitado';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Saque não encontrado ou já processado';
  END IF;

  -- Buscar carteira
  SELECT id INTO v_carteira_id FROM carteira WHERE montador_id = v_montador_id;

  -- Atualizar status do saque
  UPDATE saques 
  SET 
    status = 'rejeitado',
    processed_by = p_admin_user_id,
    updated_at = now()
  WHERE id = p_saque_id;

  -- Devolver valor para disponível
  UPDATE carteira
  SET 
    saldo_em_saque = saldo_em_saque - v_valor,
    saldo_disponivel = saldo_disponivel + v_valor
  WHERE id = v_carteira_id;

  -- Registrar transação
  INSERT INTO carteira_transacoes (
    carteira_id, tipo, valor, descricao, processed_by
  ) VALUES (
    v_carteira_id, 'saque_recusado', v_valor, 
    'Saque recusado pelo admin - valor devolvido', p_admin_user_id
  );

  -- Notificar montador
  INSERT INTO notificacoes (user_id, tipo, mensagem)
  VALUES (
    v_montador_user_id,
    'saque',
    'Saque de R$ ' || v_valor::text || ' foi recusado. O valor foi devolvido para sua conta.'
  );

  RETURN true;
END;
$function$;

-- Adicionar política para admins verem todos os saques
CREATE POLICY "Admins podem ver todos os saques"
ON saques
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);