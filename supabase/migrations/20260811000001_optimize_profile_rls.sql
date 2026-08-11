-- Optimize profiles RLS policies for speed and correct access control.
-- Using public.is_admin() is faster and safer than inline EXISTS queries.

-- Drop old policies
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- 1. All authenticated users can view all profiles.
CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- 2. Users can insert their own profile.
CREATE POLICY "profiles_insert_own_policy"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- 3. Users can update their own profile OR Admins can update any profile.
CREATE POLICY "profiles_update_policy"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- Ensure index on profile ID (primary key already has it, but good to verify)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Storage optimizations: Ensure is_admin() is used for storage as well.
DROP POLICY IF EXISTS "Admins can manage all avatars" ON storage.objects;
CREATE POLICY "avatars_admin_policy"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'avatars' AND 
  public.is_admin()
);
