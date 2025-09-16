-- Primeiro, adicionar nova coluna preco_hora na tabela montadores se não existir
ALTER TABLE montadores 
ADD COLUMN IF NOT EXISTS preco_hora NUMERIC DEFAULT 50.00;

-- Criar nova tabela de negociacoes para o sistema de contratação
CREATE TABLE IF NOT EXISTS public.negociacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  montador_id UUID NOT NULL REFERENCES montadores(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'orcamento_enviado', 'aceito', 'recusado', 'contra_proposta')),
  valor_proposto_montador NUMERIC,
  valor_proposto_cliente NUMERIC,
  observacoes_montador TEXT,
  observacoes_cliente TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela negociacoes
ALTER TABLE public.negociacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para negociacoes
CREATE POLICY "Montadores e clientes podem ver suas negociacoes" 
ON public.negociacoes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM montadores m WHERE m.id = negociacoes.montador_id AND m.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM clientes c WHERE c.id = negociacoes.cliente_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Montadores e clientes podem criar negociacoes" 
ON public.negociacoes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM montadores m WHERE m.id = negociacoes.montador_id AND m.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM clientes c WHERE c.id = negociacoes.cliente_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Montadores e clientes podem atualizar suas negociacoes" 
ON public.negociacoes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM montadores m WHERE m.id = negociacoes.montador_id AND m.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM clientes c WHERE c.id = negociacoes.cliente_id AND c.user_id = auth.uid()
  )
);

-- Adicionar novo status 'em_negociacao' ao enum job_status se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE job_status AS ENUM ('aberto', 'em_andamento', 'concluido', 'cancelado');
    END IF;
    
    -- Tentar adicionar o novo valor ao enum
    BEGIN
        ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'em_negociacao';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Função para notificar sobre nova negociação
CREATE OR REPLACE FUNCTION public.notify_new_negotiation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
  
  -- Notificar montador sobre nova intenção de contratação
  INSERT INTO notificacoes (user_id, tipo, mensagem)
  VALUES (
    montador_user_id,
    'negociacao',
    'Nova intenção de contratação: ' || substring(job_descricao, 1, 40) || '... Envie seu orçamento!'
  );
  
  RETURN NEW;
END;
$function$;

-- Trigger para notificar sobre novas negociacoes
DROP TRIGGER IF EXISTS trigger_notify_new_negotiation ON public.negociacoes;
CREATE TRIGGER trigger_notify_new_negotiation
  AFTER INSERT ON public.negociacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_negotiation();

-- Função para notificar mudanças de status na negociação
CREATE OR REPLACE FUNCTION public.notify_negotiation_status_change()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
  
  -- Inserir notificação
  INSERT INTO notificacoes (user_id, tipo, mensagem)
  VALUES (target_user_id, 'negociacao', notification_message);
  
  RETURN NEW;
END;
$function$;

-- Trigger para notificar mudanças de status
DROP TRIGGER IF EXISTS trigger_notify_negotiation_status_change ON public.negociacoes;
CREATE TRIGGER trigger_notify_negotiation_status_change
  AFTER UPDATE ON public.negociacoes
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.notify_negotiation_status_change();

-- Trigger para updated_at
CREATE TRIGGER update_negociacoes_updated_at
  BEFORE UPDATE ON public.negociacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();