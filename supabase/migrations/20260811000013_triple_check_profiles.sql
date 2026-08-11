-- 1. Robust is_admin check (Case-Insensitive)
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

  -- Fallback to hardcoded primary admin (Case-Insensitive)
  IF NOT is_admin_user THEN
    SELECT (LOWER(email) = 'shubham@acegym.com') INTO is_admin_user
    FROM auth.users 
    WHERE id = auth.uid();
  END IF;

  RETURN COALESCE(is_admin_user, false);
END;
$$;

-- 2. Triple-Check Profile Update Function
-- Uses explicit Update then Insert to bypass potential ON CONFLICT issues
CREATE OR REPLACE FUNCTION public.triple_check_update_profile(
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
DECLARE
  rows_affected int;
BEGIN
  -- Security check: Admin or Self
  IF NOT (
    auth.uid() = target_id OR 
    public.is_admin()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Step 1: Try Update
  UPDATE public.profiles 
  SET 
    full_name = new_name,
    phone = new_phone,
    avatar_url = new_avatar,
    updated_at = now()
  WHERE id = target_id;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  -- Step 2: If no rows updated, Try Insert
  IF rows_affected = 0 THEN
    INSERT INTO public.profiles (id, full_name, phone, avatar_url, updated_at)
    VALUES (target_id, new_name, new_phone, new_avatar, now())
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = now();
    RETURN 'INSERTED';
  END IF;

  RETURN 'UPDATED';
END;
$$;

-- 3. Grant access
GRANT EXECUTE ON FUNCTION public.triple_check_update_profile(uuid, text, text, text) TO authenticated;

-- 4. Simplified RLS for SELECT (Public for authenticated)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_policy" ON public.profiles;
CREATE POLICY "profiles_read_all_v2" ON public.profiles FOR SELECT TO authenticated USING (true);
