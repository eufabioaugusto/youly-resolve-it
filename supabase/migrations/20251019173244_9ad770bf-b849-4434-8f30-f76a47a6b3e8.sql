-- Adicionar policy para Admin ver todos os pagamentos
CREATE POLICY "Admins podem ver todos os pagamentos"
ON pagamentos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Atualizar status da negociação que está aceita mas ainda aparece
-- (a negociação 55bb7727-a910-4cd1-9d06-c5d85d9560e4 deveria estar "concluida" ou não aparecer)
-- Mas na verdade, o filtro em useNegociacoes já verifica jobs.ordem_servico_id

-- Por precaução, vou garantir que a consulta funcione para o montador também
CREATE POLICY "Montadores podem ver seus pagamentos relacionados" 
ON pagamentos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM montadores m
    WHERE m.id = pagamentos.montador_id
    AND m.user_id = auth.uid()
  )
);