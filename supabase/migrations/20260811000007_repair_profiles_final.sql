-- 1. Robust is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Check user_roles table
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) INTO is_admin_user;

  -- Fallback to hardcoded primary admin
  IF NOT is_admin_user THEN
    SELECT (email = 'shubham@acegym.com') INTO is_admin_user
    FROM auth.users 
    WHERE id = auth.uid();
  END IF;

  RETURN COALESCE(is_admin_user, false);
END;
$$;

-- 2. Ensure profiles table is correct
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);

-- 3. Reset RLS and Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;

-- Anyone authenticated can see any profile
CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- Anyone authenticated can INSERT/UPDATE their OWN profile
CREATE POLICY "profiles_self_policy"
ON public.profiles FOR ALL TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ADMINS can manage ALL profiles
CREATE POLICY "profiles_admin_policy"
ON public.profiles FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Storage Policies
DROP POLICY IF EXISTS "avatars_select_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_all" ON storage.objects;

CREATE POLICY "avatars_select_policy"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY "avatars_self_policy"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatars_admin_policy"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'avatars' AND public.is_admin())
WITH CHECK (bucket_id = 'avatars' AND public.is_admin());
