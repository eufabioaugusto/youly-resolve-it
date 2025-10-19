-- =====================================================
-- MIGRAÇÃO COMPLETA - SISTEMA DE OS E TIMEOUT
-- =====================================================

-- 1. Adicionar novos status ao enum job_status
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'pago';
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'a_caminho';

-- 2. Criar enum para status de ordem de serviço
CREATE TYPE ordem_servico_status AS ENUM (
  'pendente',
  'a_caminho', 
  'iniciada',
  'concluida',
  'concluida_com_assistencia',
  'pendente_pecas'
);

-- 3. Criar enum para tipo de foto
CREATE TYPE foto_tipo AS ENUM (
  'movel_caixa',
  'movel_montado',
  'portas_abertas',
  'assistencia'
);

-- 4. Criar enum para tipo de SMS
CREATE TYPE sms_tipo AS ENUM (
  'agendamento',
  'a_caminho',
  'codigo_validacao',
  'pesquisa'
);

-- 5. Criar enum para status de SMS
CREATE TYPE sms_status AS ENUM (
  'pendente',
  'enviado',
  'erro'
);

-- 6. Criar enum para status de saque
CREATE TYPE saque_status_new AS ENUM (
  'solicitado',
  'aprovado',
  'processado',
  'cancelado'
);

-- =====================================================
-- TABELA: timeout_montador
-- =====================================================
CREATE TABLE public.timeout_montador (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  negociacao_id UUID NOT NULL REFERENCES public.negociacoes(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  montador_id UUID NOT NULL REFERENCES public.montadores(id) ON DELETE CASCADE,
  data_inicio_timeout TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_expiracao TIMESTAMP WITH TIME ZONE NOT NULL,
  respondido BOOLEAN NOT NULL DEFAULT false,
  expirado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para timeout_montador
ALTER TABLE public.timeout_montador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver todos os timeouts"
ON public.timeout_montador FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Sistema pode gerenciar timeouts"
ON public.timeout_montador FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- TABELA: ordem_servico
-- =====================================================
CREATE TABLE public.ordem_servico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  negociacao_id UUID NOT NULL REFERENCES public.negociacoes(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  montador_id UUID NOT NULL REFERENCES public.montadores(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  codigo_validacao TEXT NOT NULL UNIQUE,
  status ordem_servico_status NOT NULL DEFAULT 'pendente',
  data_hora_agendamento TIMESTAMP WITH TIME ZONE,
  periodo_agendamento TEXT,
  data_hora_inicio TIMESTAMP WITH TIME ZONE,
  data_hora_conclusao TIMESTAMP WITH TIME ZONE,
  observacoes_montador TEXT,
  motivo_assistencia TEXT,
  motivo_pendente TEXT,
  garantia_ativa BOOLEAN NOT NULL DEFAULT false,
  data_ativacao_garantia TIMESTAMP WITH TIME ZONE,
  data_expiracao_garantia TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Constraint: código deve ter 6 caracteres
ALTER TABLE public.ordem_servico 
ADD CONSTRAINT codigo_validacao_length CHECK (length(codigo_validacao) = 6);

-- RLS para ordem_servico
ALTER TABLE public.ordem_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Montadores podem ver suas OS"
ON public.ordem_servico FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM montadores m
    WHERE m.id = ordem_servico.montador_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Montadores podem atualizar suas OS"
ON public.ordem_servico FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM montadores m
    WHERE m.id = ordem_servico.montador_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Clientes podem ver suas OS"
ON public.ordem_servico FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clientes c
    WHERE c.id = ordem_servico.cliente_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Sistema pode criar OS"
ON public.ordem_servico FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins podem ver todas as OS"
ON public.ordem_servico FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Trigger para updated_at
CREATE TRIGGER update_ordem_servico_updated_at
BEFORE UPDATE ON public.ordem_servico
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TABELA: ordem_servico_fotos
-- =====================================================
CREATE TABLE public.ordem_servico_fotos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem_servico_id UUID NOT NULL REFERENCES public.ordem_servico(id) ON DELETE CASCADE,
  tipo foto_tipo NOT NULL,
  url_foto TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para ordem_servico_fotos
ALTER TABLE public.ordem_servico_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Montadores podem inserir fotos em suas OS"
ON public.ordem_servico_fotos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ordem_servico os
    JOIN montadores m ON os.montador_id = m.id
    WHERE os.id = ordem_servico_fotos.ordem_servico_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Montadores podem ver fotos de suas OS"
ON public.ordem_servico_fotos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ordem_servico os
    JOIN montadores m ON os.montador_id = m.id
    WHERE os.id = ordem_servico_fotos.ordem_servico_id 
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Clientes podem ver fotos de suas OS"
ON public.ordem_servico_fotos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ordem_servico os
    JOIN clientes c ON os.cliente_id = c.id
    WHERE os.id = ordem_servico_fotos.ordem_servico_id 
    AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Admins podem ver todas as fotos"
ON public.ordem_servico_fotos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- TABELA: avaliacoes
-- =====================================================
CREATE TABLE public.avaliacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ordem_servico_id UUID NOT NULL REFERENCES public.ordem_servico(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  montador_id UUID NOT NULL REFERENCES public.montadores(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  aspectos_positivos TEXT[],
  aspectos_negativos TEXT[],
  respondida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para avaliacoes
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clientes podem criar avaliacoes"
ON public.avaliacoes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clientes c
    WHERE c.id = avaliacoes.cliente_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Clientes podem ver suas avaliacoes"
ON public.avaliacoes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM clientes c
    WHERE c.id = avaliacoes.cliente_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Montadores podem ver avaliacoes recebidas"
ON public.avaliacoes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM montadores m
    WHERE m.id = avaliacoes.montador_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Admins podem ver todas avaliacoes"
ON public.avaliacoes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- TABELA: sms_enviados
-- =====================================================
CREATE TABLE public.sms_enviados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telefone TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo sms_tipo NOT NULL,
  status sms_status NOT NULL DEFAULT 'pendente',
  ordem_servico_id UUID REFERENCES public.ordem_servico(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS para sms_enviados
ALTER TABLE public.sms_enviados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sistema pode gerenciar SMS"
ON public.sms_enviados FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins podem ver SMS"
ON public.sms_enviados FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- ALTERAÇÕES EM TABELAS EXISTENTES
-- =====================================================

-- Adicionar campos em jobs
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS ordem_servico_id UUID REFERENCES public.ordem_servico(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS data_selecionada JSONB;

-- Adicionar campos em negociacoes
ALTER TABLE public.negociacoes
ADD COLUMN IF NOT EXISTS data_resposta_montador TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS timeout_expirado BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS data_selecionada_montador JSONB;

-- Adicionar campos em montadores
ALTER TABLE public.montadores
ADD COLUMN IF NOT EXISTS total_assistencias INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS taxa_conclusao_sucesso NUMERIC NOT NULL DEFAULT 0;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX idx_timeout_montador_expiracao ON public.timeout_montador(data_expiracao, expirado);
CREATE INDEX idx_timeout_montador_negociacao ON public.timeout_montador(negociacao_id);
CREATE INDEX idx_ordem_servico_status ON public.ordem_servico(status);
CREATE INDEX idx_ordem_servico_montador ON public.ordem_servico(montador_id);
CREATE INDEX idx_ordem_servico_cliente ON public.ordem_servico(cliente_id);
CREATE INDEX idx_ordem_servico_codigo ON public.ordem_servico(codigo_validacao);
CREATE INDEX idx_avaliacoes_montador ON public.avaliacoes(montador_id);
CREATE INDEX idx_sms_enviados_status ON public.sms_enviados(status);

-- =====================================================
-- FUNÇÃO: Gerar código de validação único
-- =====================================================
CREATE OR REPLACE FUNCTION public.gerar_codigo_validacao()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  codigo TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    -- Gerar código de 6 caracteres (letras maiúsculas e números)
    codigo := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM ordem_servico WHERE codigo_validacao = codigo) INTO existe;
    
    EXIT WHEN NOT existe;
  END LOOP;
  
  RETURN codigo;
END;
$$;

-- =====================================================
-- FUNÇÃO: Atualizar estatísticas do montador
-- =====================================================
CREATE OR REPLACE FUNCTION public.atualizar_estatisticas_montador(p_montador_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_projetos INTEGER;
  v_total_avaliacoes INTEGER;
  v_soma_notas NUMERIC;
  v_media NUMERIC;
  v_total_concluidos INTEGER;
  v_total_assistencias INTEGER;
  v_taxa_sucesso NUMERIC;
BEGIN
  -- Contar projetos concluídos
  SELECT COUNT(*) INTO v_total_concluidos
  FROM ordem_servico
  WHERE montador_id = p_montador_id 
  AND status IN ('concluida', 'concluida_com_assistencia');
  
  -- Contar assistências
  SELECT COUNT(*) INTO v_total_assistencias
  FROM ordem_servico
  WHERE montador_id = p_montador_id 
  AND status = 'concluida_com_assistencia';
  
  -- Calcular taxa de sucesso
  IF v_total_concluidos > 0 THEN
    v_taxa_sucesso := ((v_total_concluidos - v_total_assistencias)::NUMERIC / v_total_concluidos::NUMERIC) * 100;
  ELSE
    v_taxa_sucesso := 0;
  END IF;
  
  -- Calcular média de avaliações
  SELECT COUNT(*), COALESCE(SUM(nota), 0) INTO v_total_avaliacoes, v_soma_notas
  FROM avaliacoes
  WHERE montador_id = p_montador_id;
  
  IF v_total_avaliacoes > 0 THEN
    v_media := v_soma_notas / v_total_avaliacoes;
  ELSE
    v_media := 0;
  END IF;
  
  -- Atualizar montador
  UPDATE montadores SET
    projetos_realizados = v_total_concluidos,
    total_avaliacoes = v_total_avaliacoes,
    avaliacao_media = v_media,
    total_assistencias = v_total_assistencias,
    taxa_conclusao_sucesso = v_taxa_sucesso,
    updated_at = now()
  WHERE id = p_montador_id;
  
  RETURN true;
END;
$$;

-- =====================================================
-- TRIGGER: Atualizar estatísticas após avaliação
-- =====================================================
CREATE OR REPLACE FUNCTION public.trigger_atualizar_stats_montador()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM atualizar_estatisticas_montador(NEW.montador_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_avaliacao_insert
AFTER INSERT ON public.avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_atualizar_stats_montador();

-- =====================================================
-- LOGS
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migração completa executada com sucesso';
  RAISE NOTICE '📊 Tabelas criadas: timeout_montador, ordem_servico, ordem_servico_fotos, avaliacoes, sms_enviados';
  RAISE NOTICE '🔧 Funções criadas: gerar_codigo_validacao, atualizar_estatisticas_montador';
  RAISE NOTICE '🔒 RLS policies aplicadas em todas as tabelas';
END $$;