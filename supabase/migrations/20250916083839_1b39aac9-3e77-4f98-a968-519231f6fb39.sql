-- Criar tipos enum
CREATE TYPE public.user_role AS ENUM ('client', 'montador', 'admin');
CREATE TYPE public.job_status AS ENUM ('aberto', 'aguardando_pagamento', 'em_andamento', 'concluido', 'cancelado');
CREATE TYPE public.candidatura_status AS ENUM ('pendente', 'aceito', 'recusado');
CREATE TYPE public.pagamento_status AS ENUM ('pago', 'pendente', 'estornado');
CREATE TYPE public.pagamento_metodo AS ENUM ('pix', 'cartao');
CREATE TYPE public.saque_status AS ENUM ('solicitado', 'pago', 'rejeitado');
CREATE TYPE public.notificacao_tipo AS ENUM ('sistema', 'job', 'pagamento', 'saque');

-- Tabela users (estendendo auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  nome TEXT NOT NULL,
  documento TEXT,
  telefone TEXT,
  endereco JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela montadores
CREATE TABLE public.montadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preco_hora DECIMAL(10,2),
  especialidades TEXT[],
  avaliacao_media DECIMAL(3,2) DEFAULT 0,
  projetos_realizados INTEGER DEFAULT 0,
  horas_trabalhadas INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ativo',
  badges TEXT[],
  documentos JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela clientes  
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  pedidos_total INTEGER DEFAULT 0,
  avaliacao_media DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela jobs
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  categoria TEXT,
  nota_fiscal TEXT,
  endereco JSONB NOT NULL,
  status job_status DEFAULT 'aberto',
  data_opcoes JSONB,
  montador_id UUID REFERENCES public.montadores(id),
  valor_estimado DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela candidaturas
CREATE TABLE public.candidaturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  montador_id UUID NOT NULL REFERENCES public.montadores(id) ON DELETE CASCADE,
  status candidatura_status DEFAULT 'pendente',
  proposta DECIMAL(10,2),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, montador_id)
);

-- Tabela pagamentos
CREATE TABLE public.pagamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id),
  montador_id UUID REFERENCES public.montadores(id),
  valor_total DECIMAL(10,2) NOT NULL,
  metodo pagamento_metodo,
  status pagamento_status DEFAULT 'pendente',
  transacao_gateway_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela carteira
CREATE TABLE public.carteira (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  montador_id UUID NOT NULL UNIQUE REFERENCES public.montadores(id) ON DELETE CASCADE,
  saldo_disponivel DECIMAL(10,2) DEFAULT 0,
  saldo_bloqueado DECIMAL(10,2) DEFAULT 0,
  total_sacado DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela saques
CREATE TABLE public.saques (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  montador_id UUID NOT NULL REFERENCES public.montadores(id) ON DELETE CASCADE,
  valor DECIMAL(10,2) NOT NULL,
  chave_pix TEXT,
  status saque_status DEFAULT 'solicitado',
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela notificacoes
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  tipo notificacao_tipo,
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.montadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carteira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para montadores
CREATE POLICY "Anyone can view montadores" ON public.montadores FOR SELECT USING (true);
CREATE POLICY "Montadores can update their own profile" ON public.montadores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Montadores can insert their own profile" ON public.montadores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para clientes
CREATE POLICY "Clientes can view their own profile" ON public.clientes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Clientes can update their own profile" ON public.clientes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Clientes can insert their own profile" ON public.clientes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para jobs
CREATE POLICY "Anyone can view jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Clientes can insert jobs" ON public.jobs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.clientes WHERE clientes.user_id = auth.uid() AND clientes.id = cliente_id)
);
CREATE POLICY "Clientes can update their own jobs" ON public.jobs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.clientes WHERE clientes.user_id = auth.uid() AND clientes.id = cliente_id)
);

-- Políticas RLS para candidaturas
CREATE POLICY "Users can view candidaturas for their jobs/montador" ON public.candidaturas FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.jobs j 
    JOIN public.clientes c ON j.cliente_id = c.id 
    WHERE j.id = job_id AND c.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.montadores m 
    WHERE m.id = montador_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Montadores can insert candidaturas" ON public.candidaturas FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.montadores WHERE montadores.user_id = auth.uid() AND montadores.id = montador_id)
);

-- Políticas RLS para carteira
CREATE POLICY "Montadores can view their own carteira" ON public.carteira FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.montadores WHERE montadores.user_id = auth.uid() AND montadores.id = montador_id)
);

-- Políticas RLS para saques
CREATE POLICY "Montadores can view their own saques" ON public.saques FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.montadores WHERE montadores.user_id = auth.uid() AND montadores.id = montador_id)
);
CREATE POLICY "Montadores can insert saques" ON public.saques FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.montadores WHERE montadores.user_id = auth.uid() AND montadores.id = montador_id)
);

-- Políticas RLS para notificacoes
CREATE POLICY "Users can view their own notifications" ON public.notificacoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notificacoes FOR UPDATE USING (auth.uid() = user_id);

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, nome)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'client')::user_role,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_montadores_updated_at BEFORE UPDATE ON public.montadores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_candidaturas_updated_at BEFORE UPDATE ON public.candidaturas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pagamentos_updated_at BEFORE UPDATE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_carteira_updated_at BEFORE UPDATE ON public.carteira FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_saques_updated_at BEFORE UPDATE ON public.saques FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();