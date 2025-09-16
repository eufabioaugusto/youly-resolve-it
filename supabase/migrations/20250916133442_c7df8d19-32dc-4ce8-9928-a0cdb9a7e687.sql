-- Adicionar campos de gamificação e foto de perfil na tabela montadores
ALTER TABLE public.montadores 
ADD COLUMN foto_perfil_url TEXT,
ADD COLUMN total_valor_movimentado NUMERIC DEFAULT 0,
ADD COLUMN total_avaliacoes INTEGER DEFAULT 0,
ADD COLUMN nivel_gamificacao TEXT DEFAULT 'Bronze',
ADD COLUMN is_premium BOOLEAN DEFAULT false;

-- Criar função para atualizar gamificação
CREATE OR REPLACE FUNCTION public.update_montador_gamification()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar valores baseados em projetos realizados, avaliações e valor movimentado
  -- Calcular nível baseado nos critérios
  IF NEW.projetos_realizados >= 100 AND NEW.total_avaliacoes >= 50 AND NEW.total_valor_movimentado >= 50000 THEN
    NEW.nivel_gamificacao = 'Hero';
  ELSIF NEW.projetos_realizados >= 50 AND NEW.total_avaliacoes >= 25 AND NEW.total_valor_movimentado >= 25000 THEN
    NEW.nivel_gamificacao = 'Platinum';
  ELSIF NEW.projetos_realizados >= 25 AND NEW.total_avaliacoes >= 15 AND NEW.total_valor_movimentado >= 10000 THEN
    NEW.nivel_gamificacao = 'Gold';
  ELSIF NEW.projetos_realizados >= 10 AND NEW.total_avaliacoes >= 5 AND NEW.total_valor_movimentado >= 5000 THEN
    NEW.nivel_gamificacao = 'Silver';
  ELSE
    NEW.nivel_gamificacao = 'Bronze';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar gamificação automaticamente
CREATE TRIGGER update_montador_gamification_trigger
  BEFORE UPDATE ON public.montadores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_montador_gamification();

-- Criar storage bucket para fotos de perfil
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true);

-- Políticas de storage para fotos de perfil
CREATE POLICY "Fotos de perfil são públicas" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-photos');

CREATE POLICY "Usuários podem fazer upload de sua própria foto" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem atualizar sua própria foto" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem deletar sua própria foto" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);