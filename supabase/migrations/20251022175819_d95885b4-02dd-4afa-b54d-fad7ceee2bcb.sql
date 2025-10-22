-- Atualizar funções de notificação para incluir metadata com IDs relevantes

-- 1. Função de notificação de pagamento aprovado
CREATE OR REPLACE FUNCTION public.notify_payment_approved()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  montador_user_id UUID;
  cliente_user_id UUID;
  job_descricao TEXT;
BEGIN
  -- Só processar quando status muda para PAGO
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
    
    -- Notificar montador com metadata
    IF montador_user_id IS NOT NULL THEN
      INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
      VALUES (
        montador_user_id,
        'pagamento',
        'Pagamento recebido: R$ ' || NEW.valor_total || ' - ' || substring(job_descricao, 1, 40) || '... (Valor bloqueado por 3 dias)',
        jsonb_build_object('job_id', NEW.job_id, 'pagamento_id', NEW.id)
      );
    END IF;
    
    -- Notificar cliente com metadata
    IF cliente_user_id IS NOT NULL THEN
      INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
      VALUES (
        cliente_user_id,
        'pagamento',
        'Pagamento confirmado: R$ ' || NEW.valor_total || ' - ' || substring(job_descricao, 1, 40) || '...',
        jsonb_build_object('job_id', NEW.job_id, 'pagamento_id', NEW.id)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Função de notificação de nova negociação
CREATE OR REPLACE FUNCTION public.notify_new_negotiation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  montador_user_id UUID;
  cliente_user_id UUID;
  job_descricao TEXT;
BEGIN
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
  
  -- Notificar montador sobre nova intenção de contratação com metadata
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    montador_user_id,
    'negociacao',
    'Nova intenção de contratação: ' || substring(job_descricao, 1, 40) || '... Envie seu orçamento!',
    jsonb_build_object('negociacao_id', NEW.id, 'job_id', NEW.job_id)
  );
  
  RETURN NEW;
END;
$function$;

-- 3. Função de notificação de mudança de status de negociação
CREATE OR REPLACE FUNCTION public.notify_negotiation_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  montador_user_id UUID;
  cliente_user_id UUID;
  job_descricao TEXT;
  notification_message TEXT;
  target_user_id UUID;
BEGIN
  -- Buscar dados necessários
  SELECT m.user_id INTO montador_user_id
  FROM montadores m
  WHERE m.id = NEW.montador_id;
  
  SELECT c.user_id INTO cliente_user_id
  FROM clientes c
  WHERE c.id = NEW.cliente_id;
  
  SELECT j.descricao INTO job_descricao
  FROM jobs j
  WHERE j.id = NEW.job_id;
  
  -- Definir mensagem e destinatário baseado no status
  CASE NEW.status
    WHEN 'orcamento_enviado' THEN
      target_user_id := cliente_user_id;
      notification_message := 'Orçamento recebido para: ' || substring(job_descricao, 1, 40) || '... Valor: R$ ' || NEW.valor_proposto_montador;
    WHEN 'aceito' THEN
      target_user_id := montador_user_id;
      notification_message := 'Orçamento aceito! Trabalho confirmado: ' || substring(job_descricao, 1, 40) || '...';
    WHEN 'recusado' THEN
      target_user_id := montador_user_id;
      notification_message := 'Orçamento recusado para: ' || substring(job_descricao, 1, 40) || '...';
    WHEN 'contra_proposta' THEN
      target_user_id := montador_user_id;
      notification_message := 'Contra-proposta recebida: ' || substring(job_descricao, 1, 40) || '... Valor: R$ ' || NEW.valor_proposto_cliente;
    ELSE
      RETURN NEW;
  END CASE;
  
  -- Inserir notificação com metadata
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    target_user_id, 
    'negociacao', 
    notification_message,
    jsonb_build_object('negociacao_id', NEW.id, 'job_id', NEW.job_id)
  );
  
  RETURN NEW;
END;
$function$;

-- 4. Função de notificação de nova candidatura
CREATE OR REPLACE FUNCTION public.notify_client_new_candidatura()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Notificar cliente com metadata
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    client_user_id,
    'sistema',
    montador_nome || ' se candidatou para seu pedido: ' || substring(job_descricao, 1, 40) || '...',
    jsonb_build_object('job_id', NEW.job_id, 'candidatura_id', NEW.id, 'montador_id', NEW.montador_id)
  );
  
  RETURN NEW;
END;
$function$;

-- 5. Função de solicitação de saque
CREATE OR REPLACE FUNCTION public.processar_solicitacao_saque()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_montador_user_id uuid;
  v_saldo_disponivel numeric;
  v_carteira_id uuid;
BEGIN
  -- Buscar carteira_id, user_id do montador e saldo disponível
  SELECT c.id, m.user_id, c.saldo_disponivel
  INTO v_carteira_id, v_montador_user_id, v_saldo_disponivel
  FROM montadores m
  JOIN carteira c ON c.montador_id = m.id
  WHERE m.id = NEW.montador_id;

  -- Verificar se tem saldo suficiente
  IF v_saldo_disponivel < NEW.valor THEN
    RAISE EXCEPTION 'Saldo insuficiente para saque';
  END IF;

  -- Transferir de disponível para em_saque
  UPDATE carteira 
  SET 
    saldo_disponivel = saldo_disponivel - NEW.valor,
    saldo_em_saque = saldo_em_saque + NEW.valor
  WHERE id = v_carteira_id;

  -- Registrar transação
  INSERT INTO carteira_transacoes (
    carteira_id, tipo, valor, descricao
  ) VALUES (
    v_carteira_id, 
    'saque_solicitado', 
    NEW.valor, 
    'Saque solicitado - Aguardando aprovação'
  );

  -- Notificar montador com metadata
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    v_montador_user_id,
    'saque',
    'Solicitação de saque de R$ ' || NEW.valor::text || ' enviada. Aguardando aprovação do administrador.',
    jsonb_build_object('saque_id', NEW.id)
  );

  RETURN NEW;
END;
$function$;