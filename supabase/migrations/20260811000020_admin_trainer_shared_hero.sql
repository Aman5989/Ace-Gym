-- Shared Trainer Detail hero permissions:
-- administrators can maintain trainer profiles, while trainers can only maintain themselves.

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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Admins may update trainer profiles; trainers may update only their own profile.
  IF NOT (public.is_admin() OR auth.uid() = target_user_id) THEN
    RAISE EXCEPTION 'Unauthorized: only an administrator or the profile owner can update details';
  END IF;

  -- The shared hero is for trainer details. Do not allow an administrator profile
  -- to be changed through this workflow.
  IF EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = target_user_id
      AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Administrator profiles cannot be updated through the trainer hero';
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

-- Admins can manage selected trainer photos; trainers retain access to their own photos.
DROP POLICY IF EXISTS "avatars_owner_manage" ON storage.objects;
DROP POLICY IF EXISTS "avatars_admin_or_owner_manage" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;

CREATE POLICY "avatars_admin_or_owner_manage"
ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    public.is_admin()
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (
    public.is_admin()
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

CREATE POLICY "avatars_public_read"
ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');
