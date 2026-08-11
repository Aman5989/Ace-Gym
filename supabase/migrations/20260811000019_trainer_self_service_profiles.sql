-- Trainer accounts manage only their own name, phone number, and profile photo.
-- Access Control remains responsible for roles only; it does not edit trainer details.

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
  IF auth.uid() IS NULL OR auth.uid() <> target_user_id THEN
    RAISE EXCEPTION 'Unauthorized: trainers can update only their own details';
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

-- Replace administrator-only avatar management with owner-only management.
DROP POLICY IF EXISTS "avatars_admin_manage" ON storage.objects;
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_manage" ON storage.objects;
DROP POLICY IF EXISTS "avatars_read_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_read_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_all" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete_policy" ON storage.objects;

CREATE POLICY "avatars_owner_manage"
ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "avatars_public_read"
ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');
