-- Criar função para notificar montadores quando job volta a ficar disponível
CREATE OR REPLACE FUNCTION public.notify_job_disponivel_novamente()
RETURNS TRIGGER AS $$
DECLARE
  montador_record RECORD;
  notification_message TEXT;
BEGIN
  -- Só notificar se o job passou para 'aberto' e tinha um montador antes
  IF NEW.status = 'aberto' AND OLD.status != 'aberto' AND OLD.montador_id IS NOT NULL THEN
    -- Criar mensagem de notificação
    notification_message := 'Trabalho disponível novamente: ' || substring(NEW.descricao, 1, 50) || '...';
    
    -- Notificar todos os montadores ativos com metadata
    FOR montador_record IN 
      SELECT m.user_id, m.id as montador_id
      FROM montadores m 
      WHERE m.status = 'ativo'
    LOOP
      INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
      VALUES (
        montador_record.user_id,
        'job',
        notification_message,
        jsonb_build_object('job_id', NEW.id)
      );
    END LOOP;
    
    -- Criar novo timeout de 40 minutos
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
      NULL,
      NULL,
      NOW() + INTERVAL '40 minutes',
      NOW(),
      false,
      false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para notificar montadores quando job volta a ficar disponível
DROP TRIGGER IF EXISTS notify_job_disponivel_trigger ON jobs;
CREATE TRIGGER notify_job_disponivel_trigger
  AFTER UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION notify_job_disponivel_novamente();