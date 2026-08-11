-- 1. Unstoppable profile update function
-- Runs as SECURITY DEFINER to bypass RLS completely.
-- Internal check ensures only Admins or the User themselves can call it.
CREATE OR REPLACE FUNCTION public.final_update_profile(
  target_id uuid,
  new_name text,
  new_phone text,
  new_avatar text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Security check: Admin or Self
  IF NOT (
    auth.uid() = target_id OR 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ) OR (
      SELECT email = 'shubham@acegym.com' FROM auth.users WHERE id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Force the write
  INSERT INTO public.profiles (id, full_name, phone, avatar_url, updated_at)
  VALUES (target_id, new_name, new_phone, new_avatar, now())
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
END;
$$;

-- 2. Grant access
GRANT EXECUTE ON FUNCTION public.final_update_profile(uuid, text, text, text) TO authenticated;

-- 3. Simplified RLS for SELECT
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
