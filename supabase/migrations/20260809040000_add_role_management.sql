-- Ace-Gym: secure Admin role management by email.
-- These SECURITY DEFINER functions keep auth.users private and expose only the role data needed by the Admin UI.

CREATE OR REPLACE FUNCTION public.admin_list_user_roles()
RETURNS TABLE (
  user_id uuid,
  email text,
  role text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::text, COALESCE(ur.role, 'trainer')::text, ur.created_at
  FROM auth.users AS u
  LEFT JOIN public.user_roles AS ur ON ur.user_id = u.id
  WHERE u.email IS NOT NULL
  ORDER BY lower(u.email);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(target_email text, target_role text)
RETURNS public.user_roles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  target_user_id uuid;
  updated_role public.user_roles;
  normalized_email text := lower(trim(target_email));
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  IF target_role NOT IN ('admin', 'trainer') THEN
    RAISE EXCEPTION 'Role must be admin or trainer';
  END IF;
  IF normalized_email = 'shubham@acegym.com' AND target_role <> 'admin' THEN
    RAISE EXCEPTION 'The primary administrator cannot be demoted';
  END IF;

  SELECT id INTO target_user_id
  FROM auth.users
  WHERE lower(email) = normalized_email
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No registered user found for this email';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, target_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role
  RETURNING * INTO updated_role;

  RETURN updated_role;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_user_roles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_role(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_user_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(text, text) TO authenticated;
