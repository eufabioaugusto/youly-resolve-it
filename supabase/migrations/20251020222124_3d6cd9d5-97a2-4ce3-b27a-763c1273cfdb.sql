-- Adicionar política RLS para permitir admins atualizarem jobs
CREATE POLICY "Admins podem atualizar jobs"
ON jobs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);