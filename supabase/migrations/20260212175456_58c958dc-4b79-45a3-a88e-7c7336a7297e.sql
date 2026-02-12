-- Adicionar tipo 'estorno' ao check constraint de carteira_transacoes
ALTER TABLE carteira_transacoes DROP CONSTRAINT carteira_transacoes_tipo_check;

ALTER TABLE carteira_transacoes ADD CONSTRAINT carteira_transacoes_tipo_check 
  CHECK (tipo = ANY (ARRAY['entrada', 'saida', 'bloqueio', 'liberacao', 'saque_solicitado', 'saque_aprovado', 'saque_recusado', 'estorno']));