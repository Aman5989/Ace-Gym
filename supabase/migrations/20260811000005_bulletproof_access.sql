-- 1. Bulletproof is_admin function
-- Explicitly handle schema names and ensure SECURITY DEFINER works as intended.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_email text;
  has_admin_role boolean;
BEGIN
  -- Get current user email from auth.users
  SELECT email INTO current_user_email FROM auth.users WHERE id = auth.uid();
  
  -- Check primary admin email
  IF current_user_email = 'shubham@acegym.com' THEN
    RETURN true;
  END IF;

  -- Check user_roles table
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) INTO has_admin_role;
  
  RETURN has_admin_role;
END;
$$;

-- 2. Re-apply RLS policies for profiles with simplified logic
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;

-- SELECT: Anyone authenticated can see any profile
CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- INSERT: User for themselves OR Admin for anyone
CREATE POLICY "profiles_insert_policy"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id OR public.is_admin());

-- UPDATE: User for themselves OR Admin for anyone
CREATE POLICY "profiles_update_policy"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- 3. Ensure Avatars storage is also robust
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_staff" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_staff" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_staff" ON storage.objects;

CREATE POLICY "avatars_select_all"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_all"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  ( (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin() )
);

CREATE POLICY "avatars_update_all"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND 
  ( (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin() )
);

CREATE POLICY "avatars_delete_all"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND 
  ( (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin() )
);
