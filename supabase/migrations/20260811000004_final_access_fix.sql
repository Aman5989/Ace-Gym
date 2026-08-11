-- 1. Final optimized is_admin function
-- Using SECURITY DEFINER to bypass RLS on user_roles during the check itself.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check primary admin email first (hardcoded for immediate access)
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND email = 'shubham@acegym.com'
  ) THEN
    RETURN true;
  END IF;

  -- Check user_roles table
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- 2. Ensure profiles table is fully accessible to staff
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Anyone logged in can see profiles (needed for the dashboard to show names)
CREATE POLICY "profiles_select_all"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- Users can insert their own, OR admins can insert for anyone
CREATE POLICY "profiles_insert_all"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id OR public.is_admin());

-- Users can update their own, OR admins can update for anyone
CREATE POLICY "profiles_update_all"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- 3. Storage Policies for Avatars
DROP POLICY IF EXISTS "avatars_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "avatars_select_public"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_staff"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  ( (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin() )
);

CREATE POLICY "avatars_update_staff"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND 
  ( (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin() )
);

CREATE POLICY "avatars_delete_staff"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND 
  ( (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin() )
);
