-- Remover constraint antiga e criar nova com todos os tipos de transação
ALTER TABLE carteira_transacoes 
DROP CONSTRAINT IF EXISTS carteira_transacoes_tipo_check;

-- Adicionar constraint atualizada com os novos tipos de saque
ALTER TABLE carteira_transacoes 
ADD CONSTRAINT carteira_transacoes_tipo_check 
CHECK (tipo IN ('entrada', 'saida', 'bloqueio', 'liberacao', 'saque_solicitado', 'saque_aprovado', 'saque_recusado'));