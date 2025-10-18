-- Permitir que todos vejam os nomes dos profiles
-- Isso é necessário para exibir nomes de montadores nos cards
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Remover a política antiga que era muito restritiva
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;