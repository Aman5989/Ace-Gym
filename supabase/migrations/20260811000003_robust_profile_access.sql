-- 1. Optimize is_admin function to include the primary admin email check for robustness
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  is_admin_role boolean;
BEGIN
  -- Check if the user is the primary administrator by email
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  IF user_email = 'shubham@acegym.com' THEN
    RETURN true;
  END IF;

  -- Check the user_roles table
  SELECT (role = 'admin') INTO is_admin_role
  FROM public.user_roles 
  WHERE user_id = auth.uid();
  
  RETURN COALESCE(is_admin_role, false);
END;
$$;

-- 2. Ensure the profiles table has proper RLS for all operations
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Anyone authenticated can view profiles
CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- Users can insert their own profile, OR Admins can insert any profile
CREATE POLICY "profiles_insert_policy"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id OR public.is_admin());

-- Users can update their own profile, OR Admins can update any profile
CREATE POLICY "profiles_update_policy"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- 3. Ensure the avatars bucket and policies are correct
-- Allow authenticated users to upload to their own folder OR Admins to any folder
DROP POLICY IF EXISTS "avatars_insert_policy" ON storage.objects;
CREATE POLICY "avatars_insert_policy"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  ( (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin() )
);

DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
CREATE POLICY "avatars_update_policy"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND 
  ( (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin() )
);

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');
