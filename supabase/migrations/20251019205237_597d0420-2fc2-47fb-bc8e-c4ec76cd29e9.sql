-- Processar manualmente o pagamento pendente da ESCRIVANINHA
DO $$
DECLARE
  v_pagamento_id uuid := '2d43c7fa-6982-48fc-a3e5-57bb749d1fc1';
  v_job_id uuid := '8019acc8-bbc2-4cdb-bd02-b02eabd23e50';
  v_montador_id uuid := 'dee04519-5225-4cea-933f-a77a6e2dc5c4';
  v_cliente_id uuid := '1fcbb789-0822-42a9-967c-2cb1d82bf050';
  v_valor_total numeric := 1.00;
  v_comissao numeric := 0.20; -- 20%
  v_valor_montador numeric := 0.80; -- 80%
  v_carteira_id uuid;
  v_negociacao_id uuid;
  v_codigo_validacao text;
  v_ordem_servico_id uuid;
BEGIN
  -- 1. Atualizar pagamento para 'pago'
  UPDATE pagamentos SET
    status = 'pago',
    mercado_pago_payment_id = '130564593202',
    mercado_pago_payment_method = 'credit_card',
    processed_at = now(),
    comissao_plataforma = v_comissao,
    valor_montador = v_valor_montador
  WHERE id = v_pagamento_id;
  
  -- 2. Buscar carteira do montador
  SELECT id INTO v_carteira_id
  FROM carteira
  WHERE montador_id = v_montador_id;
  
  -- 3. Adicionar valor à carteira (saldo em processamento)
  UPDATE carteira SET
    saldo_em_processamento = saldo_em_processamento + v_valor_montador,
    data_liberacao_admin = now() + interval '3 days'
  WHERE id = v_carteira_id;
  
  -- 4. Registrar transação na carteira
  INSERT INTO carteira_transacoes (
    carteira_id,
    tipo,
    valor,
    descricao,
    job_id,
    pagamento_id
  ) VALUES (
    v_carteira_id,
    'bloqueio',
    v_valor_montador,
    'Valor bloqueado - aguardando liberação (3 dias) - Comissão 20% = R$ 0.20',
    v_job_id,
    v_pagamento_id
  );
  
  -- 5. Buscar e atualizar negociação
  SELECT id INTO v_negociacao_id
  FROM negociacoes
  WHERE job_id = v_job_id AND montador_id = v_montador_id;
  
  UPDATE negociacoes SET
    pagamento_id = v_pagamento_id,
    data_pagamento = now(),
    valor_final = v_valor_total
  WHERE id = v_negociacao_id;
  
  -- 6. Gerar código de validação
  SELECT gerar_codigo_validacao() INTO v_codigo_validacao;
  
  -- 7. Criar ordem de serviço
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
    v_codigo_validacao
  )
  RETURNING id INTO v_ordem_servico_id;
  
  -- 8. Atualizar job com ordem_servico_id e status 'pago'
  UPDATE jobs SET
    status = 'pago',
    ordem_servico_id = v_ordem_servico_id
  WHERE id = v_job_id;
  
  RAISE NOTICE 'Pagamento processado com sucesso! OS: %', v_ordem_servico_id;
END $$;