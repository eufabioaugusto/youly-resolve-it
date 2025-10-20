-- Corrigir função com search_path seguro
CREATE OR REPLACE FUNCTION iniciar_timeout_job()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar timeout para o job recém-criado
  INSERT INTO timeout_montador (
    job_id,
    negociacao_id,
    montador_id,
    data_expiracao,
    respondido,
    expirado
  ) VALUES (
    NEW.id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    NOW() + INTERVAL '40 minutes',
    false,
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;