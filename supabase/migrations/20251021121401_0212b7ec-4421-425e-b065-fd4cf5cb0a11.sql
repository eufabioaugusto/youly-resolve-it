
-- Corrigir pagamento do Kamido para a ESTANTE/ESCRIVANINHA
UPDATE pagamentos
SET 
  valor_montador = 0.80,
  comissao_plataforma = 0.20
WHERE id = 'edd28221-07f7-48ac-8264-99a8b846367c';

-- Ajustar a carteira do montador (remover R$0.20 que foi creditado a mais)
-- O montador recebeu R$1.00 mas deveria ter recebido R$0.80
UPDATE carteira
SET 
  saldo_em_processamento = saldo_em_processamento - 0.20
WHERE montador_id = 'a63b87f8-f945-4e9f-a20c-3f640b75d83c';
