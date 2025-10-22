-- Adicionar campos de aprovação na tabela montadores
ALTER TABLE montadores 
ADD COLUMN IF NOT EXISTS status_cadastro text DEFAULT 'pendente' CHECK (status_cadastro IN ('pendente', 'aprovado', 'reprovado')),
ADD COLUMN IF NOT EXISTS documento_foto_url text,
ADD COLUMN IF NOT EXISTS motivo_reprovacao text,
ADD COLUMN IF NOT EXISTS data_aprovacao timestamp with time zone,
ADD COLUMN IF NOT EXISTS aprovado_por uuid REFERENCES auth.users(id);

-- Índice para buscar cadastros pendentes
CREATE INDEX IF NOT EXISTS idx_montadores_status_cadastro ON montadores(status_cadastro);

-- Função para aprovar cadastro de montador
CREATE OR REPLACE FUNCTION aprovar_cadastro_montador(
  p_montador_id uuid,
  p_admin_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_montador_user_id uuid;
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = p_admin_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas admins podem aprovar cadastros';
  END IF;

  -- Buscar user_id do montador
  SELECT user_id INTO v_montador_user_id
  FROM montadores
  WHERE id = p_montador_id AND status_cadastro = 'pendente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Montador não encontrado ou já processado';
  END IF;

  -- Aprovar cadastro
  UPDATE montadores 
  SET 
    status_cadastro = 'aprovado',
    status = 'ativo',
    aprovado_por = p_admin_user_id,
    data_aprovacao = now()
  WHERE id = p_montador_id;

  -- Notificar montador
  INSERT INTO notificacoes (user_id, tipo, mensagem)
  VALUES (
    v_montador_user_id,
    'sistema',
    'Parabéns! Seu cadastro foi aprovado. Você já pode começar a trabalhar!'
  );

  RETURN true;
END;
$$;

-- Função para reprovar cadastro de montador
CREATE OR REPLACE FUNCTION reprovar_cadastro_montador(
  p_montador_id uuid,
  p_admin_user_id uuid,
  p_motivo text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_montador_user_id uuid;
BEGIN
  -- Verificar se é admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = p_admin_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas admins podem reprovar cadastros';
  END IF;

  -- Buscar user_id do montador
  SELECT user_id INTO v_montador_user_id
  FROM montadores
  WHERE id = p_montador_id AND status_cadastro = 'pendente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Montador não encontrado ou já processado';
  END IF;

  -- Reprovar cadastro
  UPDATE montadores 
  SET 
    status_cadastro = 'reprovado',
    status = 'inativo',
    motivo_reprovacao = p_motivo,
    aprovado_por = p_admin_user_id,
    data_aprovacao = now()
  WHERE id = p_montador_id;

  -- Notificar montador
  INSERT INTO notificacoes (user_id, tipo, mensagem)
  VALUES (
    v_montador_user_id,
    'sistema',
    'Seu cadastro não foi aprovado. ' || p_motivo
  );

  RETURN true;
END;
$$;