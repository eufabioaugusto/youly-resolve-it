-- Continuar atualizando funções de notificação para incluir metadata

-- 6. Função de aprovar saque
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

  -- Notificar montador com metadata
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    v_montador_user_id,
    'saque',
    'Saque de R$ ' || v_valor::text || ' foi aprovado e processado!',
    jsonb_build_object('saque_id', p_saque_id)
  );

  RETURN true;
END;
$function$;

-- 7. Função de recusar saque
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

  -- Notificar montador com metadata
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    v_montador_user_id,
    'saque',
    'Saque de R$ ' || v_valor::text || ' foi recusado. O valor foi devolvido para sua conta.',
    jsonb_build_object('saque_id', p_saque_id)
  );

  RETURN true;
END;
$function$;

-- 8. Função de liberar valor da carteira
CREATE OR REPLACE FUNCTION public.liberar_valor_carteira(p_carteira_id uuid, p_admin_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_valor_processamento numeric;
  v_montador_user_id uuid;
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = p_admin_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas admins podem liberar valores';
  END IF;

  -- Buscar valor em processamento e user_id do montador
  SELECT c.saldo_em_processamento, m.user_id
  INTO v_valor_processamento, v_montador_user_id
  FROM carteira c
  JOIN montadores m ON c.montador_id = m.id
  WHERE c.id = p_carteira_id;

  IF v_valor_processamento <= 0 THEN
    RAISE EXCEPTION 'Não há valor para liberar';
  END IF;

  -- Transferir de processamento para disponível
  UPDATE carteira SET 
    saldo_disponivel = saldo_disponivel + v_valor_processamento,
    saldo_em_processamento = 0,
    data_liberacao_admin = null
  WHERE id = p_carteira_id;

  -- Registrar transação de liberação
  INSERT INTO carteira_transacoes (
    carteira_id, tipo, valor, descricao, processed_by
  ) VALUES (
    p_carteira_id, 'liberacao', v_valor_processamento, 
    'Valor liberado pelo admin', p_admin_user_id
  );

  -- Notificar montador com metadata
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    v_montador_user_id,
    'pagamento',
    'Liberação antecipada: R$ ' || v_valor_processamento::text || ' foi liberado para saque pelo administrador',
    jsonb_build_object('carteira_id', p_carteira_id)
  );

  RETURN true;
END;
$function$;

-- 9. Função de notificação de jobs disponíveis
CREATE OR REPLACE FUNCTION public.notify_available_montadores()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  montador_record RECORD;
  notification_message TEXT;
BEGIN
  -- Criar mensagem de notificação
  notification_message := 'Novo pedido disponível: ' || substring(NEW.descricao, 1, 50) || '...';
  
  -- Notificar todos os montadores ativos com metadata
  FOR montador_record IN 
    SELECT m.user_id, m.id as montador_id
    FROM montadores m 
    WHERE m.status = 'ativo'
  LOOP
    INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
    VALUES (
      montador_record.user_id,
      'job',
      notification_message,
      jsonb_build_object('job_id', NEW.id)
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;