-- Corrigir função para evitar criar ordem de serviço duplicada
CREATE OR REPLACE FUNCTION public.processar_pagamento_aprovado(
  p_pagamento_id uuid, 
  p_mp_payment_id text, 
  p_mp_payment_method text, 
  p_installments integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_valor numeric;
  v_montador_id uuid;
  v_job_id uuid;
  v_cliente_id uuid;
  v_carteira_id uuid;
  v_negociacao_id uuid;
  v_ordem_servico_id uuid;
  v_ordem_existente uuid;
BEGIN
  -- Buscar dados do pagamento
  SELECT valor_total, montador_id, job_id, cliente_id
  INTO v_valor, v_montador_id, v_job_id, v_cliente_id
  FROM pagamentos 
  WHERE id = p_pagamento_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pagamento não encontrado';
  END IF;

  -- Buscar negociação
  SELECT id INTO v_negociacao_id
  FROM negociacoes 
  WHERE job_id = v_job_id AND montador_id = v_montador_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- 🔥 VERIFICAR SE JÁ EXISTE ORDEM DE SERVIÇO PARA ESTA NEGOCIAÇÃO
  SELECT id INTO v_ordem_existente
  FROM ordem_servico
  WHERE negociacao_id = v_negociacao_id
  LIMIT 1;

  IF v_ordem_existente IS NOT NULL THEN
    -- Já existe ordem de serviço, apenas atualizar pagamento
    RAISE NOTICE 'Ordem de serviço já existe para negociacao_id %, pulando criação', v_negociacao_id;
    
    -- Atualizar pagamento como pago
    UPDATE pagamentos SET 
      status = 'pago',
      mercado_pago_payment_id = p_mp_payment_id,
      mercado_pago_payment_method = p_mp_payment_method,
      installments = p_installments,
      processed_at = now()
    WHERE id = p_pagamento_id;

    -- Atualizar negociação
    UPDATE negociacoes SET 
      pagamento_id = p_pagamento_id,
      data_pagamento = now(),
      valor_final = v_valor
    WHERE id = v_negociacao_id;

    RETURN true; -- Retornar sucesso sem criar duplicado
  END IF;

  -- Atualizar pagamento como pago
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
  UPDATE negociacoes SET 
    pagamento_id = p_pagamento_id,
    data_pagamento = now(),
    valor_final = v_valor
  WHERE id = v_negociacao_id;

  -- 🔥 CRIAR ORDEM DE SERVIÇO (agora com proteção anti-duplicação)
  INSERT INTO ordem_servico (
    negociacao_id,
    job_id,
    montador_id,
    cliente_id,
    status,
    codigo_validacao
  ) VALUES (
    v_negociacao_id,
    v_job_id,
    v_montador_id,
    v_cliente_id,
    'pendente',
    gerar_codigo_validacao()
  )
  RETURNING id INTO v_ordem_servico_id;

  -- Atualizar job com referência à OS e status 'pago'
  UPDATE jobs SET 
    status = 'pago',
    ordem_servico_id = v_ordem_servico_id
  WHERE id = v_job_id;

  RETURN true;
END;
$function$;