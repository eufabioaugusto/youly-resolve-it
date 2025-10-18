-- Função para criar perfil básico quando um usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insere o perfil básico para qualquer usuário
  INSERT INTO public.profiles (
    user_id,
    role,
    nome,
    telefone,
    documento,
    endereco
  )
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'::user_role),
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    COALESCE(NEW.raw_user_meta_data->>'documento', ''),
    NULL
  );
  
  -- Se for cliente, criar o perfil de cliente também
  IF (NEW.raw_user_meta_data->>'role') = 'client' THEN
    INSERT INTO public.clientes (
      user_id,
      pedidos_total,
      avaliacao_media
    )
    VALUES (
      NEW.id,
      0,
      0
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remove trigger antigo se existir e cria o novo
DROP TRIGGER IF EXISTS on_auth_user_profile_created ON auth.users;
CREATE TRIGGER on_auth_user_profile_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Ajusta a ordem de execução dos triggers (perfil básico antes, montador depois)
DROP TRIGGER IF EXISTS on_auth_montador_user_created ON auth.users;
CREATE TRIGGER on_auth_montador_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_montador_user();