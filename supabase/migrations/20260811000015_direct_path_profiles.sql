-- 1. Direct Path is_admin function
-- Extremely simple and robust to avoid any JWT or recursion issues.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Check user_roles table
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) INTO is_admin_user;

  -- Fallback to hardcoded primary admin email
  IF NOT is_admin_user THEN
    SELECT (LOWER(email) = 'shubham@acegym.com') INTO is_admin_user
    FROM auth.users 
    WHERE id = auth.uid();
  END IF;

  RETURN COALESCE(is_admin_user, false);
END;
$$;

-- 2. Direct Path Profile Update Function
-- This function uses a "FORCED" write approach.
CREATE OR REPLACE FUNCTION public.direct_path_update_profile(
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
    RAISE EXCEPTION 'Unauthorized: Caller is not an admin or the profile owner';
  END IF;

  -- Forced Write: Delete then Insert to ensure no old data persists
  -- and to bypass any complex ON CONFLICT logic.
  DELETE FROM public.profiles WHERE id = target_id;
  
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, updated_at)
  VALUES (target_id, new_name, new_phone, new_avatar, now());

  RETURN 'SUCCESS_FORCED_WRITE';
END;
$$;

-- 3. Grant access
GRANT EXECUTE ON FUNCTION public.direct_path_update_profile(uuid, text, text, text) TO authenticated;

-- 4. Reset RLS for Profiles to be extremely permissive for READ
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_universal_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all_v2" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;

CREATE POLICY "profiles_permissive_read" ON public.profiles FOR SELECT TO authenticated USING (true);
