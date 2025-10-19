-- Permitir Admin ver todas as carteiras
CREATE POLICY "Admins podem ver todas as carteiras"
ON carteira
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Atualizar total_valor_movimentado do montador Kamido Gomes
-- baseado no pagamento de R$ 0,80 que ele recebeu
UPDATE montadores 
SET total_valor_movimentado = 0.80,
    updated_at = now()
WHERE id = 'a63b87f8-f945-4e9f-a20c-3f640b75d83c';