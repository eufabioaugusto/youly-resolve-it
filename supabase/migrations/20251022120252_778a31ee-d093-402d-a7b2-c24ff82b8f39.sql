-- Trigger para enviar e-mail após cadastro de montador
CREATE OR REPLACE FUNCTION notificar_cadastro_montador()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_email text;
  v_nome text;
BEGIN
  -- Buscar email e nome do perfil
  SELECT p.nome, au.email INTO v_nome, v_email
  FROM profiles p
  JOIN auth.users au ON p.user_id = au.id
  WHERE p.user_id = NEW.user_id;

  -- Enviar e-mail de cadastro pendente
  PERFORM supabase.functions.invoke(
    'send-notification-email',
    '{
      "type": "cadastro_pendente",
      "to": "' || v_email || '",
      "data": {
        "montadorNome": "' || v_nome || '"
      }
    }'::jsonb
  );

  RETURN NEW;
END;
$$;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_notificar_cadastro_montador ON montadores;
CREATE TRIGGER trigger_notificar_cadastro_montador
  AFTER INSERT ON montadores
  FOR EACH ROW
  WHEN (NEW.status_cadastro = 'pendente')
  EXECUTE FUNCTION notificar_cadastro_montador();

-- Atualizar funções de aprovação/reprovação para enviar e-mails
CREATE OR REPLACE FUNCTION aprovar_cadastro_montador(
  p_montador_id uuid,
  p_admin_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_montador_user_id uuid;
  v_email text;
  v_nome text;
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

  -- Enviar e-mail
  PERFORM supabase.functions.invoke('send-notification-email',
    ('{"type": "cadastro_aprovado", "to": "' || v_email || '", "data": {"montadorNome": "' || v_nome || '"}}')::jsonb
  );

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION reprovar_cadastro_montador(
  p_montador_id uuid,
  p_admin_user_id uuid,
  p_motivo text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_montador_user_id uuid;
  v_email text;
  v_nome text;
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

  PERFORM supabase.functions.invoke('send-notification-email',
    ('{"type": "cadastro_reprovado", "to": "' || v_email || '", "data": {"montadorNome": "' || v_nome || '", "motivo": "' || p_motivo || '"}}')::jsonb
  );

  RETURN true;
END;
$$;