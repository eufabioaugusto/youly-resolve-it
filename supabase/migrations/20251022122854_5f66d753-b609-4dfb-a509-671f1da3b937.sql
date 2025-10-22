-- Restaurar função que envia email de cadastro pendente
CREATE OR REPLACE FUNCTION public.notificar_cadastro_montador()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_nome text;
  v_payload jsonb;
  v_service_role_key text;
BEGIN
  -- Buscar email e nome do perfil
  SELECT p.nome, au.email INTO v_nome, v_email
  FROM profiles p
  JOIN auth.users au ON p.user_id = au.id
  WHERE p.user_id = NEW.user_id;

  -- Pegar a service role key das configurações
  v_service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Se não houver service role key configurada, usar a do ambiente
  IF v_service_role_key IS NULL OR v_service_role_key = '' THEN
    v_service_role_key := current_setting('SUPABASE_SERVICE_ROLE_KEY', true);
  END IF;

  -- Construir payload JSON de forma segura
  v_payload := jsonb_build_object(
    'type', 'cadastro_pendente',
    'to', v_email,
    'data', jsonb_build_object(
      'montadorNome', v_nome
    )
  );

  -- Enviar email via edge function usando extensão http
  PERFORM
    extensions.http_post(
      url := 'https://ttzgwemurovxdxhgbdxz.supabase.co/functions/v1/send-notification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0emd3ZW11cm92eGR4aGdiZHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTAwMjAsImV4cCI6MjA3MzU4NjAyMH0.uTpOmMiiA0SqHuTNlmqGVaG6FfxhggDcTfXPfR9I0pU'
      ),
      body := v_payload::text
    );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log o erro mas não bloqueia o cadastro
    RAISE WARNING 'Erro ao enviar email de cadastro: %', SQLERRM;
    RETURN NEW;
END;
$$;