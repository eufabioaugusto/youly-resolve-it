-- Corrigir função de notificação de cadastro montador com JSON seguro
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
BEGIN
  -- Buscar email e nome do perfil
  SELECT p.nome, au.email INTO v_nome, v_email
  FROM profiles p
  JOIN auth.users au ON p.user_id = au.id
  WHERE p.user_id = NEW.user_id;

  -- Construir payload JSON de forma segura
  v_payload := jsonb_build_object(
    'type', 'cadastro_pendente',
    'to', v_email,
    'data', jsonb_build_object(
      'montadorNome', v_nome
    )
  );

  -- Enviar e-mail de cadastro pendente
  PERFORM net.http_post(
    url := 'https://ttzgwemurovxdxhgbdxz.supabase.co/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := v_payload
  );

  RETURN NEW;
END;
$$;

-- Corrigir função de aprovação de cadastro com JSON seguro
CREATE OR REPLACE FUNCTION public.aprovar_cadastro_montador(p_montador_id uuid, p_admin_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_montador_user_id uuid;
  v_email text;
  v_nome text;
  v_payload jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = p_admin_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Apenas admins podem aprovar cadastros';
  END IF;

  SELECT user_id INTO v_montador_user_id
  FROM montadores WHERE id = p_montador_id AND status_cadastro = 'pendente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Montador não encontrado ou já processado';
  END IF;

  -- Buscar dados para e-mail
  SELECT p.nome, au.email INTO v_nome, v_email
  FROM profiles p
  JOIN auth.users au ON p.user_id = au.id
  WHERE p.user_id = v_montador_user_id;

  UPDATE montadores SET 
    status_cadastro = 'aprovado', status = 'ativo',
    aprovado_por = p_admin_user_id, data_aprovacao = now()
  WHERE id = p_montador_id;

  INSERT INTO notificacoes (user_id, tipo, mensagem)
  VALUES (v_montador_user_id, 'sistema', 'Parabéns! Seu cadastro foi aprovado!');

  -- Construir payload JSON de forma segura
  v_payload := jsonb_build_object(
    'type', 'cadastro_aprovado',
    'to', v_email,
    'data', jsonb_build_object(
      'montadorNome', v_nome
    )
  );

  -- Enviar e-mail usando http_post (mais confiável que supabase.functions.invoke)
  PERFORM net.http_post(
    url := 'https://ttzgwemurovxdxhgbdxz.supabase.co/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := v_payload
  );

  RETURN true;
END;
$$;

-- Corrigir função de reprovação de cadastro com JSON seguro
CREATE OR REPLACE FUNCTION public.reprovar_cadastro_montador(p_montador_id uuid, p_admin_user_id uuid, p_motivo text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_montador_user_id uuid;
  v_email text;
  v_nome text;
  v_payload jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = p_admin_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Apenas admins podem reprovar cadastros';
  END IF;

  SELECT user_id INTO v_montador_user_id
  FROM montadores WHERE id = p_montador_id AND status_cadastro = 'pendente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Montador não encontrado ou já processado';
  END IF;

  SELECT p.nome, au.email INTO v_nome, v_email
  FROM profiles p
  JOIN auth.users au ON p.user_id = au.id
  WHERE p.user_id = v_montador_user_id;

  UPDATE montadores SET 
    status_cadastro = 'reprovado', status = 'inativo',
    motivo_reprovacao = p_motivo,
    aprovado_por = p_admin_user_id, data_aprovacao = now()
  WHERE id = p_montador_id;

  INSERT INTO notificacoes (user_id, tipo, mensagem)
  VALUES (v_montador_user_id, 'sistema', 'Seu cadastro não foi aprovado. ' || p_motivo);

  -- Construir payload JSON de forma segura
  v_payload := jsonb_build_object(
    'type', 'cadastro_reprovado',
    'to', v_email,
    'data', jsonb_build_object(
      'montadorNome', v_nome,
      'motivo', p_motivo
    )
  );

  PERFORM net.http_post(
    url := 'https://ttzgwemurovxdxhgbdxz.supabase.co/functions/v1/send-notification-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := v_payload
  );

  RETURN true;
END;
$$;