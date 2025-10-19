-- Adicionar campo de comissão da plataforma na tabela pagamentos
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS comissao_plataforma NUMERIC DEFAULT 0;

-- Adicionar campo valor_montador (valor que vai para o montador após comissão)
ALTER TABLE pagamentos ADD COLUMN IF NOT EXISTS valor_montador NUMERIC DEFAULT 0;

-- Atualizar a transação existente de R$ 1 com a comissão correta
UPDATE pagamentos 
SET 
  comissao_plataforma = valor_total * 0.20,
  valor_montador = valor_total * 0.80
WHERE id = '72567556-bf7f-4c64-b1e0-0d64db8499bf';

-- Corrigir a carteira do montador para refletir o valor correto (R$ 0,80 ao invés de R$ 1)
UPDATE carteira 
SET saldo_em_processamento = 0.80
WHERE montador_id = (
  SELECT montador_id FROM pagamentos WHERE id = '72567556-bf7f-4c64-b1e0-0d64db8499bf'
);

-- Corrigir a transação na carteira
UPDATE carteira_transacoes
SET valor = 0.80, descricao = 'Valor bloqueado - aguardando liberação (3 dias) - Comissão 20%'
WHERE pagamento_id = '72567556-bf7f-4c64-b1e0-0d64db8499bf';