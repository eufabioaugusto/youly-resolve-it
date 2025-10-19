-- Corrigir carteira do montador específico
UPDATE carteira 
SET 
  saldo_disponivel = 0,
  saldo_em_saque = 0
WHERE montador_id = 'dee04519-5225-4cea-933f-a77a6e2dc5c4';

-- Corrigir função de solicitação de saque para garantir movimentação correta
CREATE OR REPLACE FUNCTION public.processar_solicitacao_saque()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_montador_user_id uuid;
  v_saldo_disponivel numeric;
  v_carteira_id uuid;
BEGIN
  -- Buscar carteira_id, user_id do montador e saldo disponível
  SELECT c.id, m.user_id, c.saldo_disponivel
  INTO v_carteira_id, v_montador_user_id, v_saldo_disponivel
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
  WHERE id = v_carteira_id;

  -- Registrar transação
  INSERT INTO carteira_transacoes (
    carteira_id, tipo, valor, descricao
  ) VALUES (
    v_carteira_id, 
    'saque_solicitado', 
    NEW.valor, 
    'Saque solicitado - Aguardando aprovação'
  );

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