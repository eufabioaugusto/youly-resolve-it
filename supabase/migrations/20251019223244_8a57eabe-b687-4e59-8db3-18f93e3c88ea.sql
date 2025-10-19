-- Habilitar realtime para tabela notificacoes
ALTER TABLE notificacoes REPLICA IDENTITY FULL;

-- Adicionar tabela à publicação do realtime (se não estiver)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notificacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes;
  END IF;
END $$;