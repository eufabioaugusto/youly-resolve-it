-- Corrigir valores de jobs afetados pelo bug do parseFloat
-- parseFloat("1.000,00") retornava 1 ao invés de 1000
-- Multiplicar por 1000 os valores < 10 que foram claramente afetados
UPDATE jobs SET valor_estimado = valor_estimado * 1000 WHERE valor_estimado IS NOT NULL AND valor_estimado < 10;

-- Corrigir pagamentos afetados (mesma causa)
UPDATE pagamentos SET 
  valor_total = valor_total * 1000,
  valor_montador = valor_montador * 1000,
  comissao_plataforma = comissao_plataforma * 1000
WHERE valor_total IS NOT NULL AND valor_total < 10;

-- Corrigir negociações afetadas
UPDATE negociacoes SET 
  valor_final = valor_final * 1000
WHERE valor_final IS NOT NULL AND valor_final < 10;

UPDATE negociacoes SET 
  valor_proposto_montador = valor_proposto_montador * 1000
WHERE valor_proposto_montador IS NOT NULL AND valor_proposto_montador < 10;

UPDATE negociacoes SET 
  valor_proposto_cliente = valor_proposto_cliente * 1000
WHERE valor_proposto_cliente IS NOT NULL AND valor_proposto_cliente < 10;

-- Corrigir carteira (saldo_em_processamento afetado)
UPDATE carteira SET 
  saldo_em_processamento = saldo_em_processamento * 1000
WHERE saldo_em_processamento IS NOT NULL AND saldo_em_processamento > 0 AND saldo_em_processamento < 10;

UPDATE carteira SET 
  saldo_disponivel = saldo_disponivel * 1000
WHERE saldo_disponivel IS NOT NULL AND saldo_disponivel > 0 AND saldo_disponivel < 10;

-- Corrigir transações da carteira
UPDATE carteira_transacoes SET 
  valor = valor * 1000
WHERE valor IS NOT NULL AND valor > 0 AND valor < 10;