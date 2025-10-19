-- Corrigir jobs que ficaram presos com negociações recusadas
UPDATE jobs
SET 
  status = 'aberto',
  montador_id = NULL
WHERE id IN (
  SELECT DISTINCT j.id
  FROM jobs j
  INNER JOIN negociacoes n ON n.job_id = j.id
  WHERE n.status = 'recusado'
    AND j.status = 'em_negociacao'
    AND j.ordem_servico_id IS NULL
);

-- Criar função para verificar e liberar jobs com negociações recusadas
CREATE OR REPLACE FUNCTION liberar_jobs_negociacao_recusada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Quando uma negociação é recusada, liberar o job
  IF NEW.status = 'recusado' AND (OLD.status IS NULL OR OLD.status != 'recusado') THEN
    UPDATE jobs
    SET 
      status = 'aberto',
      montador_id = NULL
    WHERE id = NEW.job_id
      AND ordem_servico_id IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para liberar jobs automaticamente quando negociação for recusada
DROP TRIGGER IF EXISTS trigger_liberar_job_negociacao_recusada ON negociacoes;
CREATE TRIGGER trigger_liberar_job_negociacao_recusada
  AFTER UPDATE ON negociacoes
  FOR EACH ROW
  EXECUTE FUNCTION liberar_jobs_negociacao_recusada();