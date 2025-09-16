-- Adicionar campo chave_pix na tabela montadores
ALTER TABLE public.montadores ADD COLUMN IF NOT EXISTS chave_pix text;