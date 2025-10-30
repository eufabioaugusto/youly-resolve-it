-- Adicionar campo tipo_servico na tabela jobs
ALTER TABLE jobs ADD COLUMN tipo_servico text[] DEFAULT ARRAY[]::text[];