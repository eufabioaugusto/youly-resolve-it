-- Alterar campo tipo_servico para text ao invés de array
ALTER TABLE jobs ALTER COLUMN tipo_servico TYPE text USING tipo_servico[1];