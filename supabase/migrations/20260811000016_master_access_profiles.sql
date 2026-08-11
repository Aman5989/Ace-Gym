-- 1. Master Access is_admin function
-- This is the most robust version, prioritizing the primary admin email.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_email text;
BEGIN
  -- Get caller email directly from auth.users to avoid any JWT issues
  SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();
  
  -- Master bypass for primary admin
  IF LOWER(caller_email) = 'shubham@acegym.com' THEN
    RETURN true;
  END IF;

  -- Check user_roles table
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- 2. Master Access Profile Update Function
-- Returns the UPDATED record so the API can verify the write.
CREATE OR REPLACE FUNCTION public.master_update_profile_v2(
  target_id uuid,
  new_name text,
  new_phone text,
  new_avatar text
)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  avatar_url text,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Security check
  IF NOT (auth.uid() = target_id OR public.is_admin()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Perform Upsert
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, updated_at)
  VALUES (target_id, new_name, new_phone, new_avatar, now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

  -- Return the newly written row
  RETURN QUERY SELECT p.id, p.full_name, p.phone, p.avatar_url, p.updated_at 
  FROM public.profiles p WHERE p.id = target_id;
END;
$$;

-- 3. Grant access
GRANT EXECUTE ON FUNCTION public.master_update_profile_v2(uuid, text, text, text) TO authenticated;

-- 4. Permissive Read Policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_permissive_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_universal_read" ON public.profiles;
CREATE POLICY "profiles_authenticated_read" ON public.profiles FOR SELECT TO authenticated USING (true);
