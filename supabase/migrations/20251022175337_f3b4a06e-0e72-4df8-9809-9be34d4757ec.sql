-- Permitir que montadores criem avaliações quando a OS pertence a eles
-- (situação onde o montador registra a avaliação feita pelo cliente na hora)
CREATE POLICY "Montadores podem criar avaliacoes de suas OS"
ON avaliacoes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM ordem_servico os
    JOIN montadores m ON os.montador_id = m.id
    WHERE os.id = avaliacoes.ordem_servico_id
    AND m.user_id = auth.uid()
  )
);