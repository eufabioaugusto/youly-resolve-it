-- Corrigir função processar_pagamento_aprovado para usar status 'pago'
CREATE OR REPLACE FUNCTION public.processar_pagamento_aprovado(
  p_pagamento_id uuid, 
  p_mp_payment_id text, 
  p_mp_payment_method text, 
  p_installments integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_valor numeric;
  v_montador_id uuid;
  v_job_id uuid;
  v_carteira_id uuid;
  v_negociacao_id uuid;
BEGIN
  -- Buscar dados do pagamento
  SELECT valor_total, montador_id, job_id 
  INTO v_valor, v_montador_id, v_job_id
  FROM pagamentos 
  WHERE id = p_pagamento_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pagamento não encontrado';
  END IF;

  -- Atualizar pagamento como pago (não aprovado)
  UPDATE pagamentos SET 
    status = 'pago',
    mercado_pago_payment_id = p_mp_payment_id,
    mercado_pago_payment_method = p_mp_payment_method,
    installments = p_installments,
    processed_at = now()
  WHERE id = p_pagamento_id;

  -- Buscar carteira do montador
  SELECT id INTO v_carteira_id 
  FROM carteira 
  WHERE montador_id = v_montador_id;

  -- Bloquear valor na carteira (vai para saldo_em_processamento)
  UPDATE carteira SET 
    saldo_em_processamento = saldo_em_processamento + v_valor,
    data_liberacao_admin = now() + interval '3 days'
  WHERE id = v_carteira_id;

  -- Registrar transação de bloqueio
  INSERT INTO carteira_transacoes (
    carteira_id, tipo, valor, descricao, job_id, pagamento_id
  ) VALUES (
    v_carteira_id, 'bloqueio', v_valor, 
    'Valor bloqueado - aguardando liberação (3 dias)', 
    v_job_id, p_pagamento_id
  );

  -- Atualizar negociação
  SELECT id INTO v_negociacao_id
  FROM negociacoes 
  WHERE job_id = v_job_id AND montador_id = v_montador_id;

  UPDATE negociacoes SET 
    pagamento_id = p_pagamento_id,
    data_pagamento = now(),
    valor_final = v_valor
  WHERE id = v_negociacao_id;

  -- Atualizar status do job para 'pago'
  UPDATE jobs SET status = 'pago' WHERE id = v_job_id;

  RETURN true;
END;
$$;