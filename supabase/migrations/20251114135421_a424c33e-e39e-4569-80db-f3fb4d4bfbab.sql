
-- Remover constraint antiga de status
ALTER TABLE negociacoes DROP CONSTRAINT IF EXISTS negociacoes_status_check;

-- Adicionar nova constraint que inclui 'cancelado'
ALTER TABLE negociacoes ADD CONSTRAINT negociacoes_status_check 
  CHECK (status IN ('pendente', 'orcamento_enviado', 'aceito', 'recusado', 'contra_proposta', 'cancelado'));
