-- Adicionar política RLS para permitir admins criarem negociações
CREATE POLICY "Admins podem criar negociacoes"
ON negociacoes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Adicionar política RLS para permitir admins visualizarem todas negociações
CREATE POLICY "Admins podem ver todas negociacoes"
ON negociacoes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Adicionar política RLS para permitir admins atualizarem negociações
CREATE POLICY "Admins podem atualizar negociacoes"
ON negociacoes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);