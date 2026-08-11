-- 1. Create a robust profile update function
-- This runs as SECURITY DEFINER to bypass RLS on the profiles table
-- but includes its own internal security check.
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
  target_user_id uuid,
  new_full_name text,
  new_phone text,
  new_avatar_url text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Internal Security Check: Only allow if the caller is an admin
  -- or if the caller is the user themselves.
  IF NOT (
    auth.uid() = target_user_id OR 
    public.is_admin()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins or the user themselves can update this profile';
  END IF;

  -- Perform the Upsert
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, updated_at)
  VALUES (target_user_id, new_full_name, new_phone, new_avatar_url, now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
END;
$$;

-- 2. Grant execute permission to authenticated users
REVOKE ALL ON FUNCTION public.admin_update_user_profile(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile(uuid, text, text, text) TO authenticated;

-- 3. Ensure profiles table RLS is still present but the RPC bypasses it
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING (true);
