
-- Criar OS para negociações pagas que não têm OS
-- (Correção para pagamentos já processados)

DO $$
DECLARE
  v_os_id uuid;
BEGIN
  -- OS 1: Negociação 3298c3c1-66b3-4b58-b308-0ec8e186c639
  INSERT INTO ordem_servico (
    negociacao_id,
    job_id,
    montador_id,
    cliente_id,
    status,
    codigo_validacao
  )
  SELECT 
    '3298c3c1-66b3-4b58-b308-0ec8e186c639'::uuid,
    job_id,
    montador_id,
    cliente_id,
    'pendente',
    upper(substring(md5(random()::text) from 1 for 6))
  FROM negociacoes
  WHERE id = '3298c3c1-66b3-4b58-b308-0ec8e186c639'
  RETURNING id INTO v_os_id;

  -- Atualizar job
  UPDATE jobs 
  SET ordem_servico_id = v_os_id
  WHERE id = (SELECT job_id FROM negociacoes WHERE id = '3298c3c1-66b3-4b58-b308-0ec8e186c639');

  -- OS 2: Negociação 81ce4128-8788-43d0-834a-feb5aa327a1a
  INSERT INTO ordem_servico (
    negociacao_id,
    job_id,
    montador_id,
    cliente_id,
    status,
    codigo_validacao
  )
  SELECT 
    '81ce4128-8788-43d0-834a-feb5aa327a1a'::uuid,
    job_id,
    montador_id,
    cliente_id,
    'pendente',
    upper(substring(md5(random()::text) from 1 for 6))
  FROM negociacoes
  WHERE id = '81ce4128-8788-43d0-834a-feb5aa327a1a'
  RETURNING id INTO v_os_id;

  -- Atualizar job
  UPDATE jobs 
  SET ordem_servico_id = v_os_id
  WHERE id = (SELECT job_id FROM negociacoes WHERE id = '81ce4128-8788-43d0-834a-feb5aa327a1a');

  RAISE NOTICE 'Ordens de serviço criadas com sucesso';
END $$;
