-- 1. Bulletproof is_admin function
-- Strictly qualify all columns to avoid "ambiguous" errors.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_email text;
BEGIN
  -- Strictly qualify auth.users.id
  SELECT u.email INTO caller_email FROM auth.users u WHERE u.id = auth.uid();
  
  -- Master bypass for primary admin
  IF LOWER(caller_email) = 'shubham@acegym.com' THEN
    RETURN true;
  END IF;

  -- Check user_roles table with strict qualification
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
  );
END;
$$;

-- 2. Fixed Master Access Profile Update Function
-- Renamed output columns (profile_id, etc.) to avoid ambiguity with table columns.
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
  -- Security check
  IF NOT (auth.uid() = target_user_id OR public.is_admin()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Perform Upsert with strict qualification
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, updated_at)
  VALUES (target_user_id, new_full_name, new_phone, new_avatar_url, now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

  -- Return the newly written row with unique column names
  RETURN QUERY 
  SELECT p.id, p.full_name, p.phone, p.avatar_url, p.updated_at 
  FROM public.profiles p 
  WHERE p.id = target_user_id;
END;
$$;

-- 3. Grant access
REVOKE ALL ON FUNCTION public.master_update_profile_v3(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.master_update_profile_v3(uuid, text, text, text) TO authenticated;

-- 4. Permissive Read Policy (Ensuring a clean state)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_authenticated_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_permissive_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_universal_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;

CREATE POLICY "profiles_authenticated_select" ON public.profiles FOR SELECT TO authenticated USING (true);
