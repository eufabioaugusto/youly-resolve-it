-- Corrigir função notify_available_montadores para usar valor correto do enum
CREATE OR REPLACE FUNCTION public.notify_available_montadores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  montador_record RECORD;
  notification_message TEXT;
BEGIN
  -- Criar mensagem de notificação
  notification_message := 'Novo pedido disponível: ' || substring(NEW.descricao, 1, 50) || '...';
  
  -- Notificar todos os montadores ativos (eles filtrarão por localização no frontend)
  FOR montador_record IN 
    SELECT m.user_id, m.id as montador_id
    FROM montadores m 
    WHERE m.status = 'ativo'
  LOOP
    INSERT INTO notificacoes (user_id, tipo, mensagem)
    VALUES (
      montador_record.user_id,
      'job',
      notification_message
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Corrigir função notify_client_new_candidatura para usar valor correto do enum
CREATE OR REPLACE FUNCTION public.notify_client_new_candidatura()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  client_user_id UUID;
  montador_nome TEXT;
  job_descricao TEXT;
BEGIN
  -- Buscar user_id do cliente
  SELECT c.user_id INTO client_user_id
  FROM jobs j
  JOIN clientes c ON j.cliente_id = c.id
  WHERE j.id = NEW.job_id;
  
  -- Buscar nome do montador
  SELECT p.nome INTO montador_nome
  FROM montadores m
  JOIN profiles p ON m.user_id = p.user_id
  WHERE m.id = NEW.montador_id;
  
  -- Buscar descrição do job
  SELECT j.descricao INTO job_descricao
  FROM jobs j
  WHERE j.id = NEW.job_id;
  
  -- Notificar cliente
  INSERT INTO notificacoes (user_id, tipo, mensagem)
  VALUES (
    client_user_id,
    'sistema',
    montador_nome || ' se candidatou para seu pedido: ' || substring(job_descricao, 1, 40) || '...'
  );
  
  RETURN NEW;
END;
$$;