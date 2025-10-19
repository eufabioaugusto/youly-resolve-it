-- Atualizar função para incluir notificação quando admin libera valor
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

  -- 🔔 ENVIAR NOTIFICAÇÃO AO MONTADOR
  INSERT INTO notificacoes (user_id, tipo, mensagem)
  VALUES (
    v_montador_user_id,
    'pagamento',
    'Liberação antecipada: R$ ' || v_valor_processamento::text || ' foi liberado para saque pelo administrador'
  );

  RETURN true;
END;
$function$;