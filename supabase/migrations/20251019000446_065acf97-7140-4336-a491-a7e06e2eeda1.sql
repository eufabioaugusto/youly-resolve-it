-- Permitir que o sistema (triggers com SECURITY DEFINER) crie notificações
CREATE POLICY "Sistema pode inserir notificacoes" 
ON public.notificacoes 
FOR INSERT 
WITH CHECK (true);