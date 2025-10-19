-- Permitir Montadores verem clientes através das OS
CREATE POLICY "Montadores podem ver clientes de suas OS"
ON clientes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ordem_servico os
    JOIN montadores m ON os.montador_id = m.id
    WHERE os.cliente_id = clientes.id
    AND m.user_id = auth.uid()
  )
);