-- Adicionar política RLS para admins visualizarem todos os clientes
CREATE POLICY "Admins podem ver todos os clientes"
ON clientes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);