-- Remove triggers antigos que estão causando conflito
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_montador_profile ON profiles;
DROP TRIGGER IF EXISTS ensure_client_profile ON profiles;

-- Remove as funções antigas que não são mais necessárias
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_montador_profile() CASCADE;
DROP FUNCTION IF EXISTS public.ensure_client_profile() CASCADE;

-- Recria os triggers corretos na ordem certa
DROP TRIGGER IF EXISTS on_auth_user_profile_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_montador_user_created ON auth.users;

-- Primeiro trigger: cria perfil básico (profiles + clientes se aplicável)
CREATE TRIGGER on_auth_user_profile_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Segundo trigger: cria perfil de montador (montadores + carteira)
CREATE TRIGGER on_auth_montador_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_montador_user();