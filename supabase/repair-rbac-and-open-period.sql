-- Ace-Gym repair: fix user_roles RLS recursion and restore payment recording.
-- Run this in Supabase SQL Editor.

-- A SECURITY DEFINER helper can check roles without being trapped by the
-- user_roles policy that is currently querying user_roles recursively.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Replace the recursive policy with a helper-based policy.
DROP POLICY IF EXISTS "user_roles_select_own_or_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_own_or_admin"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Replace all role-check policies with the non-recursive helper.
DROP POLICY IF EXISTS "payments_admin_select" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_insert" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_update" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_delete" ON public.payments;
CREATE POLICY "payments_admin_select" ON public.payments FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "payments_admin_insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "payments_admin_update" ON public.payments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "payments_admin_delete" ON public.payments FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "collection_periods_admin_select" ON public.collection_periods;
DROP POLICY IF EXISTS "collection_periods_admin_insert" ON public.collection_periods;
DROP POLICY IF EXISTS "collection_periods_admin_update" ON public.collection_periods;
CREATE POLICY "collection_periods_admin_select" ON public.collection_periods FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "collection_periods_admin_insert" ON public.collection_periods FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "collection_periods_admin_update" ON public.collection_periods FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Ensure the primary Admin role exists.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE lower(email) = 'shubham@acegym.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Ensure one open period exists. Existing payments are preserved.
INSERT INTO public.collection_periods (period_key, status)
SELECT to_char(current_date, 'YYYY-MM'), 'open'
WHERE NOT EXISTS (
  SELECT 1 FROM public.collection_periods WHERE status = 'open'
);

-- Assign any legacy unassigned payments to the latest open period.
UPDATE public.payments
SET period_id = (
  SELECT id
  FROM public.collection_periods
  WHERE status = 'open'
  ORDER BY opened_at DESC
  LIMIT 1
)
WHERE period_id IS NULL;
