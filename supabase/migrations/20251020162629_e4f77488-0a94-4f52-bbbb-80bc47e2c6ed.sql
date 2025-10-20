-- Criar trigger para iniciar timeout automaticamente quando um job é criado
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
    '00000000-0000-0000-0000-000000000000'::uuid, -- UUID temporário pois ainda não há negociação
    '00000000-0000-0000-0000-000000000000'::uuid, -- UUID temporário pois ainda não há montador
    NOW() + INTERVAL '40 minutes',
    false,
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger na tabela jobs
DROP TRIGGER IF EXISTS trigger_iniciar_timeout_job ON jobs;
CREATE TRIGGER trigger_iniciar_timeout_job
  AFTER INSERT ON jobs
  FOR EACH ROW
  WHEN (NEW.status = 'aberto')
  EXECUTE FUNCTION iniciar_timeout_job();

-- Configurar cron job para processar timeouts expirados a cada 5 minutos
SELECT cron.schedule(
  'processar-timeouts-expirados',
  '*/5 * * * *', -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://ttzgwemurovxdxhgbdxz.supabase.co/functions/v1/processar-timeout-montador',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0emd3ZW11cm92eGR4aGdiZHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTAwMjAsImV4cCI6MjA3MzU4NjAyMH0.uTpOmMiiA0SqHuTNlmqGVaG6FfxhggDcTfXPfR9I0pU"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);