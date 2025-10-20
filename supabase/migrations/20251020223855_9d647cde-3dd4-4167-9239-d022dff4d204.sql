
-- Processar pagamento PIX aprovado para o job "ESTANTE/ESCRIVANINHA 98 CM X 2,08 M MANGOOD"
-- Isso vai:
-- 1. Marcar pagamento como 'pago'
-- 2. Criar ordem de serviço
-- 3. Atualizar job para status 'pago'
-- 4. Bloquear valor na carteira do montador

SELECT processar_pagamento_aprovado(
  'edd28221-07f7-48ac-8264-99a8b846367c'::uuid,  -- pagamento_id
  'PIX-MANUAL-' || extract(epoch from now())::text,  -- mp_payment_id
  'pix',  -- mp_payment_method
  1  -- installments
);
