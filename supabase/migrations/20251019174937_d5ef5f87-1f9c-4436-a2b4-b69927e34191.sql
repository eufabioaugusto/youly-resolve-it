-- Criar Ordem de Serviço para o pagamento existente
DO $$
DECLARE
  v_ordem_servico_id uuid;
BEGIN
  -- Criar a OS
  INSERT INTO ordem_servico (
    negociacao_id,
    job_id,
    montador_id,
    cliente_id,
    status,
    codigo_validacao
  ) VALUES (
    '55bb7727-a910-4cd1-9d06-c5d85d9560e4',
    'b290bf6a-c3d1-4b39-865a-7ba92f224f79',
    'a63b87f8-f945-4e9f-a20c-3f640b75d83c',
    '1fcbb789-0822-42a9-967c-2cb1d82bf050',
    'pendente',
    gerar_codigo_validacao()
  )
  RETURNING id INTO v_ordem_servico_id;

  -- Atualizar job com referência à OS
  UPDATE jobs SET 
    ordem_servico_id = v_ordem_servico_id
  WHERE id = 'b290bf6a-c3d1-4b39-865a-7ba92f224f79';

  RAISE NOTICE 'Ordem de Serviço criada com sucesso: %', v_ordem_servico_id;
END $$;