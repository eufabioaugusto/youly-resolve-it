
-- Dropar e recriar a função corrigida
DROP TRIGGER IF EXISTS notify_payment_approved_trigger ON pagamentos;
DROP FUNCTION IF EXISTS notify_payment_approved() CASCADE;

-- Criar função corrigida
CREATE OR REPLACE FUNCTION public.notify_payment_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  montador_user_id UUID;
  cliente_user_id UUID;
  job_descricao TEXT;
BEGIN
  -- Só processar quando status muda para PAGO (não aprovado)
  IF NEW.status = 'pago' AND (OLD IS NULL OR OLD.status IS NULL OR OLD.status != 'pago') THEN
    -- Buscar user_id do montador
    SELECT m.user_id INTO montador_user_id
    FROM montadores m
    WHERE m.id = NEW.montador_id;
    
    -- Buscar user_id do cliente
    SELECT c.user_id INTO cliente_user_id
    FROM clientes c
    WHERE c.id = NEW.cliente_id;
    
    -- Buscar descrição do job
    SELECT j.descricao INTO job_descricao
    FROM jobs j
    WHERE j.id = NEW.job_id;
    
    -- Notificar montador
    IF montador_user_id IS NOT NULL THEN
      INSERT INTO notificacoes (user_id, tipo, mensagem)
      VALUES (
        montador_user_id,
        'pagamento',
        'Pagamento recebido: R$ ' || NEW.valor_total || ' - ' || substring(job_descricao, 1, 40) || '... (Valor bloqueado por 3 dias)'
      );
    END IF;
    
    -- Notificar cliente  
    IF cliente_user_id IS NOT NULL THEN
      INSERT INTO notificacoes (user_id, tipo, mensagem)
      VALUES (
        cliente_user_id,
        'pagamento',
        'Pagamento confirmado: R$ ' || NEW.valor_total || ' - ' || substring(job_descricao, 1, 40) || '...'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER notify_payment_approved_trigger
  AFTER INSERT OR UPDATE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_approved();
