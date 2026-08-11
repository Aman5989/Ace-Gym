-- 1. Master is_admin function (Non-Recursive & Robust)
-- We use auth.jwt() to avoid table recursion if possible.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_email text;
  is_admin_user boolean;
BEGIN
  -- Get caller email from JWT or auth.users
  caller_email := auth.jwt() ->> 'email';
  
  -- Check hardcoded primary admin
  IF caller_email = 'shubham@acegym.com' THEN
    RETURN true;
  END IF;

  -- Check user_roles table
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) INTO is_admin_user;

  RETURN COALESCE(is_admin_user, false);
END;
$$;

-- 2. Master Bypass Profile Update Function
-- This function is designed to be "Unstoppable" for Admins.
CREATE OR REPLACE FUNCTION public.master_bypass_update_profile(
  target_id uuid,
  new_name text,
  new_phone text,
  new_avatar text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Security check: Admin or Self
  IF NOT (
    auth.uid() = target_id OR 
    public.is_admin()
  ) THEN
    RAISE EXCEPTION 'Unauthorized Access';
  END IF;

  -- Direct Write to bypass all RLS policies on the table
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, updated_at)
  VALUES (target_id, new_name, new_phone, new_avatar, now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

  RETURN 'SUCCESS_PERSISTED';
END;
$$;

-- 3. Grant access
GRANT EXECUTE ON FUNCTION public.master_bypass_update_profile(uuid, text, text, text) TO authenticated;

-- 4. Ensure Profiles table is visible
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_read_all_v2" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_universal_read" ON public.profiles FOR SELECT TO authenticated USING (true);
