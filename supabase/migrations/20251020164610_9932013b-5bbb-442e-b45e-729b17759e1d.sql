-- Remover constraints NOT NULL de campos que podem não existir inicialmente
ALTER TABLE timeout_montador 
ALTER COLUMN negociacao_id DROP NOT NULL,
ALTER COLUMN montador_id DROP NOT NULL;

-- Recriar função para iniciar timeout
CREATE OR REPLACE FUNCTION iniciar_timeout_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar timeout apenas para jobs com status 'aberto'
  IF NEW.status = 'aberto' THEN
    INSERT INTO timeout_montador (
      job_id,
      negociacao_id,
      montador_id,
      data_expiracao,
      data_inicio_timeout,
      respondido,
      expirado
    ) VALUES (
      NEW.id,
      NULL, -- Será preenchido quando houver negociação
      NULL, -- Será preenchido quando houver negociação
      NOW() + INTERVAL '40 minutes',
      NOW(),
      false,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS trigger_iniciar_timeout_job ON jobs;
CREATE TRIGGER trigger_iniciar_timeout_job
AFTER INSERT ON jobs
FOR EACH ROW
EXECUTE FUNCTION iniciar_timeout_job();

-- Criar timeouts para jobs em aberto existentes que não têm
INSERT INTO timeout_montador (
  job_id,
  negociacao_id,
  montador_id,
  data_expiracao,
  data_inicio_timeout,
  respondido,
  expirado
)
SELECT 
  j.id,
  NULL,
  NULL,
  NOW() + INTERVAL '40 minutes',
  NOW(),
  false,
  false
FROM jobs j
LEFT JOIN timeout_montador t ON j.id = t.job_id
WHERE j.status = 'aberto' 
  AND t.id IS NULL;