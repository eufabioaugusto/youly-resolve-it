-- Corrigir valores dos pagamentos de teste que estão com R$ 1.000 mas foram pagos R$ 1
UPDATE pagamentos 
SET 
  valor_total = 1.00,
  comissao_plataforma = 0.20,
  valor_montador = 0.80
WHERE status = 'pago';

-- Corrigir também os estornados
UPDATE pagamentos 
SET 
  valor_total = 1.00,
  comissao_plataforma = 0.20,
  valor_montador = 0.80
WHERE status = 'estornado';

-- Corrigir negociações com valor_final errado
UPDATE negociacoes 
SET valor_final = 1.00
WHERE valor_final = 1000 AND pagamento_id IS NOT NULL;

-- Corrigir carteiras - zerar e recalcular com valores corretos de teste
-- Cada pagamento pago = R$ 0.80 para montador
UPDATE carteira SET 
  saldo_em_processamento = 0,
  saldo_disponivel = 0,
  saldo_bloqueado = 0
WHERE saldo_em_processamento > 100 OR saldo_disponivel > 100;