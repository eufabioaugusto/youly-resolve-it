-- Trigger para notificar quando Ordem de Serviço é criada
CREATE OR REPLACE FUNCTION public.notify_os_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_montador_user_id UUID;
  v_cliente_user_id UUID;
  v_job_descricao TEXT;
BEGIN
  -- Buscar user_id do montador
  SELECT user_id INTO v_montador_user_id
  FROM montadores WHERE id = NEW.montador_id;
  
  -- Buscar user_id do cliente
  SELECT user_id INTO v_cliente_user_id
  FROM clientes WHERE id = NEW.cliente_id;
  
  -- Buscar descrição do job
  SELECT descricao INTO v_job_descricao
  FROM jobs WHERE id = NEW.job_id;
  
  -- Notificar montador
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    v_montador_user_id,
    'sistema',
    'Nova OS atribuída: ' || substring(v_job_descricao, 1, 40) || '... Código: ' || NEW.codigo_validacao,
    jsonb_build_object('ordem_servico_id', NEW.id, 'job_id', NEW.job_id)
  );
  
  -- Notificar cliente
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    v_cliente_user_id,
    'sistema',
    'Ordem de serviço criada! Aguardando agendamento do montador. Código: ' || NEW.codigo_validacao,
    jsonb_build_object('ordem_servico_id', NEW.id, 'job_id', NEW.job_id)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar mudanças de status da OS
CREATE OR REPLACE FUNCTION public.notify_os_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_montador_user_id UUID;
  v_cliente_user_id UUID;
  v_job_descricao TEXT;
  v_mensagem_cliente TEXT;
  v_mensagem_montador TEXT;
BEGIN
  -- Só processar se o status mudou
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Buscar dados necessários
  SELECT user_id INTO v_montador_user_id FROM montadores WHERE id = NEW.montador_id;
  SELECT user_id INTO v_cliente_user_id FROM clientes WHERE id = NEW.cliente_id;
  SELECT descricao INTO v_job_descricao FROM jobs WHERE id = NEW.job_id;
  
  -- Definir mensagens baseadas no novo status
  CASE NEW.status
    WHEN 'a_caminho' THEN
      v_mensagem_cliente := 'O montador está a caminho! ' || substring(v_job_descricao, 1, 40) || '...';
      v_mensagem_montador := NULL;
    WHEN 'iniciada' THEN
      v_mensagem_cliente := 'Montagem iniciada! ' || substring(v_job_descricao, 1, 40) || '...';
      v_mensagem_montador := NULL;
    WHEN 'concluida' THEN
      v_mensagem_cliente := 'Montagem concluída com sucesso! ' || substring(v_job_descricao, 1, 40) || '...';
      v_mensagem_montador := 'Você concluiu a montagem! ' || substring(v_job_descricao, 1, 40) || '... Garantia ativada.';
    WHEN 'concluida_com_assistencia' THEN
      v_mensagem_cliente := 'Montagem concluída! ' || substring(v_job_descricao, 1, 40) || '...';
      v_mensagem_montador := 'Assistência concluída! ' || substring(v_job_descricao, 1, 40) || '...';
    WHEN 'pendente_pecas' THEN
      v_mensagem_cliente := 'Montagem pendente - aguardando peças. ' || substring(v_job_descricao, 1, 40) || '...';
      v_mensagem_montador := NULL;
    ELSE
      RETURN NEW;
  END CASE;
  
  -- Notificar cliente se houver mensagem
  IF v_mensagem_cliente IS NOT NULL THEN
    INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
    VALUES (
      v_cliente_user_id,
      'sistema',
      v_mensagem_cliente,
      jsonb_build_object('ordem_servico_id', NEW.id, 'job_id', NEW.job_id)
    );
  END IF;
  
  -- Notificar montador se houver mensagem
  IF v_mensagem_montador IS NOT NULL THEN
    INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
    VALUES (
      v_montador_user_id,
      'sistema',
      v_mensagem_montador,
      jsonb_build_object('ordem_servico_id', NEW.id, 'job_id', NEW.job_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar montador quando recebe avaliação
CREATE OR REPLACE FUNCTION public.notify_new_avaliacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_montador_user_id UUID;
  v_cliente_nome TEXT;
BEGIN
  -- Buscar user_id do montador
  SELECT user_id INTO v_montador_user_id
  FROM montadores WHERE id = NEW.montador_id;
  
  -- Buscar nome do cliente
  SELECT p.nome INTO v_cliente_nome
  FROM clientes c
  JOIN profiles p ON c.user_id = p.user_id
  WHERE c.id = NEW.cliente_id;
  
  -- Notificar montador
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    v_montador_user_id,
    'sistema',
    v_cliente_nome || ' avaliou seu trabalho com ' || NEW.nota || ' estrelas!',
    jsonb_build_object('ordem_servico_id', NEW.ordem_servico_id, 'job_id', NEW.job_id)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger para notificar quando garantia é ativada
CREATE OR REPLACE FUNCTION public.notify_garantia_ativada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_montador_user_id UUID;
  v_cliente_user_id UUID;
  v_job_descricao TEXT;
BEGIN
  -- Só processar se garantia foi ativada
  IF OLD.garantia_ativa = NEW.garantia_ativa THEN
    RETURN NEW;
  END IF;
  
  IF NEW.garantia_ativa = false THEN
    RETURN NEW;
  END IF;
  
  -- Buscar dados
  SELECT user_id INTO v_montador_user_id FROM montadores WHERE id = NEW.montador_id;
  SELECT user_id INTO v_cliente_user_id FROM clientes WHERE id = NEW.cliente_id;
  SELECT descricao INTO v_job_descricao FROM jobs WHERE id = NEW.job_id;
  
  -- Notificar cliente
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    v_cliente_user_id,
    'sistema',
    'Garantia ativada até ' || to_char(NEW.data_expiracao_garantia, 'DD/MM/YYYY') || '! ' || substring(v_job_descricao, 1, 30) || '...',
    jsonb_build_object('ordem_servico_id', NEW.id, 'job_id', NEW.job_id)
  );
  
  -- Notificar montador
  INSERT INTO notificacoes (user_id, tipo, mensagem, metadata)
  VALUES (
    v_montador_user_id,
    'sistema',
    'Garantia ativada para: ' || substring(v_job_descricao, 1, 30) || '... Válida até ' || to_char(NEW.data_expiracao_garantia, 'DD/MM/YYYY'),
    jsonb_build_object('ordem_servico_id', NEW.id, 'job_id', NEW.job_id)
  );
  
  RETURN NEW;
END;
$$;

-- Criar os triggers
DROP TRIGGER IF EXISTS trigger_notify_os_created ON ordem_servico;
CREATE TRIGGER trigger_notify_os_created
  AFTER INSERT ON ordem_servico
  FOR EACH ROW
  EXECUTE FUNCTION notify_os_created();

DROP TRIGGER IF EXISTS trigger_notify_os_status_change ON ordem_servico;
CREATE TRIGGER trigger_notify_os_status_change
  AFTER UPDATE ON ordem_servico
  FOR EACH ROW
  EXECUTE FUNCTION notify_os_status_change();

DROP TRIGGER IF EXISTS trigger_notify_new_avaliacao ON avaliacoes;
CREATE TRIGGER trigger_notify_new_avaliacao
  AFTER INSERT ON avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_avaliacao();

DROP TRIGGER IF EXISTS trigger_notify_garantia_ativada ON ordem_servico;
CREATE TRIGGER trigger_notify_garantia_ativada
  AFTER UPDATE ON ordem_servico
  FOR EACH ROW
  EXECUTE FUNCTION notify_garantia_ativada();