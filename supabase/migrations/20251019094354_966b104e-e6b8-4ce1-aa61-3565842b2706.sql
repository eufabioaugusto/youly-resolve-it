-- Criar trigger para adicionar role admin automaticamente quando perfil admin é criado
-- Isso garante que o primeiro admin seja criado corretamente via AdminRegister

CREATE OR REPLACE FUNCTION public.handle_new_admin_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o profile criado tem role admin, criar registro em user_roles
  IF NEW.role = 'admin' THEN
    INSERT INTO public.user_roles (user_id, role, assigned_by)
    VALUES (NEW.user_id, 'admin'::app_role, NEW.user_id)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger que roda APÓS inserção do profile
DROP TRIGGER IF EXISTS on_admin_profile_created ON public.profiles;
CREATE TRIGGER on_admin_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'admin')
  EXECUTE FUNCTION public.handle_new_admin_profile();