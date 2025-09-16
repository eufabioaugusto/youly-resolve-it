-- Corrigir sistema completo de notificações e candidaturas

-- Criar função para criar perfil completo do cliente automaticamente
CREATE OR REPLACE FUNCTION public.ensure_client_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Se é um cliente, criar o perfil na tabela clientes automaticamente
  IF NEW.role = 'client' THEN
    INSERT INTO public.clientes (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para executar após inserir ou atualizar perfil
CREATE TRIGGER ensure_client_profile_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_client_profile();

-- Atualizar função handle_new_user para garantir criação do perfil cliente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir na tabela profiles
  INSERT INTO public.profiles (user_id, role, nome)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'client')::user_role,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email)
  );
  
  -- Se for cliente, inserir também na tabela clientes
  IF COALESCE(NEW.raw_user_meta_data ->> 'role', 'client')::user_role = 'client' THEN
    INSERT INTO public.clientes (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar sistema de notificações para montadores quando novos jobs são criados
CREATE OR REPLACE FUNCTION public.notify_available_montadores()
RETURNS TRIGGER AS $$
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
      'novo_job',
      notification_message
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para notificar montadores quando job é criado
CREATE TRIGGER notify_montadores_new_job
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_available_montadores();

-- Criar função para notificar cliente quando há nova candidatura
CREATE OR REPLACE FUNCTION public.notify_client_new_candidatura()
RETURNS TRIGGER AS $$
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
    'nova_candidatura',
    montador_nome || ' se candidatou para seu pedido: ' || substring(job_descricao, 1, 40) || '...'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para notificar cliente sobre candidaturas
CREATE TRIGGER notify_client_candidatura
  AFTER INSERT ON public.candidaturas
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_client_new_candidatura();

-- Garantir que todos os clientes existentes tenham perfil
INSERT INTO public.clientes (user_id)
SELECT p.user_id
FROM profiles p
LEFT JOIN clientes c ON p.user_id = c.user_id
WHERE p.role = 'client' AND c.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;