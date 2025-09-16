-- Create a security definer function to check if user has admin role
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = user_uuid 
    AND role = 'admin'
  );
$$;

-- Create a function to create the first admin (can only be used when no admins exist)
CREATE OR REPLACE FUNCTION public.create_first_admin(
  admin_email text,
  admin_password text,
  admin_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
  admin_count integer;
BEGIN
  -- Check if any admin already exists
  SELECT COUNT(*) INTO admin_count FROM profiles WHERE role = 'admin';
  
  IF admin_count > 0 THEN
    RETURN json_build_object('error', 'Admin already exists');
  END IF;
  
  -- Create the admin user (this would need to be done via Supabase Auth API)
  -- This function returns instructions for manual creation
  RETURN json_build_object(
    'success', true, 
    'message', 'Create user manually in Supabase Auth, then update their profile role to admin'
  );
END;
$$;

-- Create a function to promote user to admin (only existing admins can do this)
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can promote users to admin';
  END IF;
  
  -- Update the target user's role to admin
  UPDATE profiles 
  SET role = 'admin', updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN FOUND;
END;
$$;

-- Update the handle_new_user function to support admin creation via metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, nome)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'client')::user_role,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.email)
  );
  RETURN NEW;
END;
$$;