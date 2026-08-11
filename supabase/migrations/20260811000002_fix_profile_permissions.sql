-- Fix: Allow Admins to INSERT profiles for other users.
-- This was the reason trainer data wasn't showing (upsert failed on initial insert).

-- 1. Update the is_admin function to be even more efficient
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Use a direct lookup which is faster than EXISTS in many cases
  SELECT (role = 'admin') 
  FROM public.user_roles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- 2. Fix Profile Policies
DROP POLICY IF EXISTS "profiles_insert_own_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

-- Allow users to insert their own profile OR Admins to insert any profile
CREATE POLICY "profiles_insert_policy"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id OR public.is_admin());

-- Allow users to update their own profile OR Admins to update any profile
CREATE POLICY "profiles_update_policy"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- 3. Storage Policy Fix
-- Ensure Admins can also INSERT/UPDATE avatars for others
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "avatars_insert_policy"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  ( (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin() )
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "avatars_update_policy"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND 
  ( (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin() )
);
