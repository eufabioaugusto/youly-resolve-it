
-- Processar transação de teste
DO $$
DECLARE
  v_carteira_id uuid;
  v_negociacao_id uuid;
  v_codigo_validacao text;
  v_os_id uuid;
BEGIN
  -- 1. Atualizar pagamento
  UPDATE pagamentos SET 
    status = 'pago',
    mercado_pago_payment_id = '129965982363',
    mercado_pago_payment_method = 'pix',
    installments = 1,
    processed_at = now()
  WHERE id = '72567556-bf7f-4c64-b1e0-0d64db8499bf';

  -- 2. Buscar carteira e bloquear valor
  SELECT id INTO v_carteira_id 
  FROM carteira 
  WHERE montador_id = 'a63b87f8-f945-4e9f-a20c-3f640b75d83c';

  UPDATE carteira SET 
    saldo_em_processamento = saldo_em_processamento + 1,
    data_liberacao_admin = now() + interval '3 days'
  WHERE id = v_carteira_id;

  -- 3. Registrar transação
  INSERT INTO carteira_transacoes (
    carteira_id, tipo, valor, descricao, job_id, pagamento_id
  ) VALUES (
    v_carteira_id, 'bloqueio', 1, 
    'Valor bloqueado - aguardando liberação (3 dias)', 
    'b290bf6a-c3d1-4b39-865a-7ba92f224f79', '72567556-bf7f-4c64-b1e0-0d64db8499bf'
  );

  -- 4. Atualizar negociação
  SELECT id INTO v_negociacao_id
  FROM negociacoes 
  WHERE job_id = 'b290bf6a-c3d1-4b39-865a-7ba92f224f79' 
  AND montador_id = 'a63b87f8-f945-4e9f-a20c-3f640b75d83c';

  UPDATE negociacoes SET 
    pagamento_id = '72567556-bf7f-4c64-b1e0-0d64db8499bf',
    data_pagamento = now(),
    valor_final = 1
  WHERE id = v_negociacao_id;

  -- 5. Atualizar job
  UPDATE jobs SET status = 'pago' 
  WHERE id = 'b290bf6a-c3d1-4b39-865a-7ba92f224f79';

  -- 6. Criar Ordem de Serviço
  v_codigo_validacao := upper(substring(md5(random()::text) from 1 for 6));

  INSERT INTO ordem_servico (
    negociacao_id, job_id, montador_id, cliente_id, 
    status, codigo_validacao, data_hora_agendamento, periodo_agendamento
  )
  SELECT 
    v_negociacao_id,
    'b290bf6a-c3d1-4b39-865a-7ba92f224f79',
    'a63b87f8-f945-4e9f-a20c-3f640b75d83c',
    '1fcbb789-0822-42a9-967c-2cb1d82bf050',
    'pendente',
    v_codigo_validacao,
    (n.data_selecionada_montador->>'data_hora')::timestamptz,
    n.data_selecionada_montador->>'periodo'
  FROM negociacoes n
  WHERE n.id = v_negociacao_id
  RETURNING id INTO v_os_id;

  -- 7. Vincular OS ao job
  UPDATE jobs SET ordem_servico_id = v_os_id
  WHERE id = 'b290bf6a-c3d1-4b39-865a-7ba92f224f79';

  RAISE NOTICE '✅ Transação processada! OS: %, Código: %', v_os_id, v_codigo_validacao;
END $$;
