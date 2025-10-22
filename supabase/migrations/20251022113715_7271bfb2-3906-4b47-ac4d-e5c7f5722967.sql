-- Criar política para admins verem todos os jobs (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'jobs' 
    AND policyname = 'Admins podem ver todos os jobs'
  ) THEN
    CREATE POLICY "Admins podem ver todos os jobs" ON jobs
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'admin'
      )
    );
  END IF;
END $$;