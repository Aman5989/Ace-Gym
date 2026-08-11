-- 1. Fix RLS Recursion: Rewrite is_admin to bypass RLS on user_roles
-- We use a SECURITY DEFINER function with a restricted search path.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Direct check against the table, bypassing RLS
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) INTO is_admin_user;

  -- Fallback for the primary administrator
  IF NOT is_admin_user THEN
    SELECT (email = 'shubham@acegym.com') INTO is_admin_user
    FROM auth.users 
    WHERE id = auth.uid();
  END IF;

  RETURN COALESCE(is_admin_user, false);
END;
$$;

-- 2. Profiles Table: Simplified and robust policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL previous policy variants to ensure no conflicts
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_own_policy" ON public.profiles;

-- Anyone authenticated can see any profile
CREATE POLICY "profiles_read_policy"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- Admins can do EVERYTHING (Insert, Update, Delete) for any profile
CREATE POLICY "profiles_admin_policy"
ON public.profiles FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can manage their OWN profile
CREATE POLICY "profiles_self_policy"
ON public.profiles FOR ALL TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Storage Policies: Ensure Admins have full control
DROP POLICY IF EXISTS "avatars_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_self_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_admin_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_read_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_admin_manage" ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_own" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_staff" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_staff" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_staff" ON storage.objects;
DROP POLICY IF EXISTS "avatars_read_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "avatars_read_all"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_admin_policy"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'avatars' AND public.is_admin())
WITH CHECK (bucket_id = 'avatars' AND public.is_admin());

CREATE POLICY "avatars_self_policy"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
