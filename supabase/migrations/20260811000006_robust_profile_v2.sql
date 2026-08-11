-- 1. Simplify is_admin check for maximum speed and reliability
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) OR (
    SELECT email = 'shubham@acegym.com' 
    FROM auth.users 
    WHERE id = auth.uid()
  );
$$;

-- 2. Profiles Table: Grant Admins full control to fix the "No data found" issue
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;

-- Anyone authenticated can see any profile (needed for dashboard)
CREATE POLICY "profiles_read_all"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- Admins can do ANYTHING to any profile (Insert, Update, Delete)
CREATE POLICY "profiles_admin_all"
ON public.profiles FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can manage their own profile
CREATE POLICY "profiles_user_own"
ON public.profiles FOR ALL TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Storage: Grant Admins full control over avatars
DROP POLICY IF EXISTS "avatars_select_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_all" ON storage.objects;

CREATE POLICY "avatars_read_public"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_admin_manage"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'avatars' AND public.is_admin())
WITH CHECK (bucket_id = 'avatars' AND public.is_admin());

CREATE POLICY "avatars_user_own"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Diagnostics View (Run this to see if data exists)
-- SELECT * FROM public.profiles;
