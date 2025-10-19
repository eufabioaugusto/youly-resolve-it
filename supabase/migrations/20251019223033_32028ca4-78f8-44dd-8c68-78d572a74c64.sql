-- Deletar saque duplicado mais antigo e ajustar carteira
DO $$
DECLARE
  v_carteira_id uuid;
BEGIN
  -- Buscar carteira do montador
  SELECT id INTO v_carteira_id 
  FROM carteira 
  WHERE montador_id = 'dee04519-5225-4cea-933f-a77a6e2dc5c4';

  -- Devolver valor do saque duplicado para disponível
  UPDATE carteira 
  SET 
    saldo_em_saque = saldo_em_saque - 0.80,
    saldo_disponivel = saldo_disponivel + 0.80
  WHERE id = v_carteira_id;

  -- Deletar transação relacionada ao saque antigo
  DELETE FROM carteira_transacoes 
  WHERE carteira_id = v_carteira_id 
    AND tipo = 'saque_solicitado'
    AND valor = 0.80
    AND created_at < '2025-10-19 22:27:00';

  -- Deletar saque duplicado mais antigo
  DELETE FROM saques 
  WHERE id = '2bc62d64-473e-45ef-9e3f-4893c776a5bc';
END $$;