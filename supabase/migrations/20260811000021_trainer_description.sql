-- Add a short trainer biography shown in the shared Trainer Detail hero.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS description text;

-- The five-argument overload carries the new description field.
CREATE OR REPLACE FUNCTION public.master_update_profile_v3(
  target_user_id uuid,
  new_full_name text,
  new_phone text,
  new_avatar_url text,
  new_description text
)
RETURNS TABLE (
  profile_id uuid,
  profile_name text,
  profile_phone text,
  profile_avatar text,
  profile_description text,
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

  IF EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = target_user_id
      AND ur.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Administrator profiles cannot be updated through the trainer hero';
  END IF;

  INSERT INTO public.profiles AS p (id, full_name, phone, avatar_url, description, updated_at)
  VALUES (target_user_id, new_full_name, new_phone, new_avatar_url, new_description, now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    description = EXCLUDED.description,
    updated_at = now();

  RETURN QUERY
  SELECT p.id, p.full_name, p.phone, p.avatar_url, p.description, p.updated_at
  FROM public.profiles p
  WHERE p.id = target_user_id;
END;
$$;

-- Only the new description-aware function is used by the application.
REVOKE ALL ON FUNCTION public.master_update_profile_v3(uuid, text, text, text) FROM PUBLIC, authenticated;
REVOKE ALL ON FUNCTION public.master_update_profile_v3(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.master_update_profile_v3(uuid, text, text, text, text) TO authenticated;
