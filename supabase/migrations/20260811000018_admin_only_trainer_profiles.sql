-- Trainer profile details are displayed in the trainer dashboard but are maintained only by administrators.
-- The application treats an account with no explicit user_roles row as a trainer.

-- Remove every legacy profile write/read policy before applying the least-privilege policy set.
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_delete" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_authenticated_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_authenticated_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_permissive_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all_v2" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_universal_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_user_own_policy" ON public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trainers can only read their own dashboard data; administrators can read every trainer profile.
CREATE POLICY "profiles_read_own_or_admin"
ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR public.is_admin());

-- Do not grant direct insert, update, or delete policies. Writes use the audited RPC below.

-- The only supported profile mutation path is an administrator selecting a trainer in Access control.
CREATE OR REPLACE FUNCTION public.master_update_profile_v3(
  target_user_id uuid,
  new_full_name text,
  new_phone text,
  new_avatar_url text
)
RETURNS TABLE (
  profile_id uuid,
  profile_name text,
  profile_phone text,
  profile_avatar text,
  profile_updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: administrator access is required to update trainer details';
  END IF;

  -- Accounts without an explicit role default to trainer in the application. Explicit admin
  -- accounts are intentionally excluded from this trainer-details workflow.
  IF EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = target_user_id
      AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Administrator profiles cannot be updated through the trainer-details workflow';
  END IF;

  INSERT INTO public.profiles AS p (id, full_name, phone, avatar_url, updated_at)
  VALUES (target_user_id, new_full_name, new_phone, new_avatar_url, now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

  RETURN QUERY
  SELECT p.id, p.full_name, p.phone, p.avatar_url, p.updated_at
  FROM public.profiles p
  WHERE p.id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.master_update_profile_v3(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.master_update_profile_v3(uuid, text, text, text) TO authenticated;

-- Only administrators may create, replace, or remove avatar files. Public reads are retained
-- because trainer dashboard images use public storage URLs.
DROP POLICY IF EXISTS "Admins can manage all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "avatars_admin_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_admin_manage" ON storage.objects;
DROP POLICY IF EXISTS "avatars_admin_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_staff" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_staff" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_read_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_read_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_self_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_self_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_staff" ON storage.objects;
DROP POLICY IF EXISTS "avatars_user_own" ON storage.objects;

CREATE POLICY "avatars_admin_manage"
ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'avatars' AND public.is_admin())
WITH CHECK (bucket_id = 'avatars' AND public.is_admin());

CREATE POLICY "avatars_public_read"
ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');
