-- Criar tabela para tokens de pesquisa
CREATE TABLE IF NOT EXISTS pesquisa_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  ordem_servico_id UUID REFERENCES ordem_servico(id) ON DELETE CASCADE,
  usado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days')
);

-- Índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_pesquisa_tokens_token ON pesquisa_tokens(token);
CREATE INDEX IF NOT EXISTS idx_pesquisa_tokens_usado ON pesquisa_tokens(usado);

-- RLS policies
ALTER TABLE pesquisa_tokens ENABLE ROW LEVEL SECURITY;

-- Sistema pode criar tokens
CREATE POLICY "Sistema pode criar tokens"
  ON pesquisa_tokens FOR INSERT
  WITH CHECK (true);

-- Sistema pode atualizar tokens
CREATE POLICY "Sistema pode atualizar tokens"
  ON pesquisa_tokens FOR UPDATE
  USING (true);

-- Qualquer um pode ler tokens válidos (para permitir pesquisas públicas)
CREATE POLICY "Tokens podem ser lidos"
  ON pesquisa_tokens FOR SELECT
  USING (true);