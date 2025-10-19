-- Habilitar realtime para tabela carteira
ALTER TABLE carteira REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação do realtime
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'carteira'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE carteira;
  END IF;
END $$;