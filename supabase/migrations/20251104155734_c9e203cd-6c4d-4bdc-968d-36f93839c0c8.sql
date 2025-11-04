-- Adicionar colunas para rastreamento de cancelamento
-- O status é tipo text, então não precisa alterar enum
ALTER TABLE negociacoes 
  ADD COLUMN IF NOT EXISTS motivo_cancelamento text,
  ADD COLUMN IF NOT EXISTS data_cancelamento timestamp with time zone,
  ADD COLUMN IF NOT EXISTS cancelado_por uuid REFERENCES auth.users(id);