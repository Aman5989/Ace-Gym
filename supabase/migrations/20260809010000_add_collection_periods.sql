CREATE TABLE IF NOT EXISTS public.collection_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  closed_by uuid REFERENCES auth.users(id),
  total_amount numeric NOT NULL DEFAULT 0,
  cash_amount numeric NOT NULL DEFAULT 0,
  upi_amount numeric NOT NULL DEFAULT 0,
  payment_count integer NOT NULL DEFAULT 0,
  notes text
);

ALTER TABLE public.collection_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collection_periods_select_authenticated" ON public.collection_periods FOR SELECT TO authenticated USING (true);
CREATE POLICY "collection_periods_insert_authenticated" ON public.collection_periods FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "collection_periods_update_authenticated" ON public.collection_periods FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS period_id uuid REFERENCES public.collection_periods(id);
CREATE INDEX IF NOT EXISTS idx_payments_period_id ON public.payments(period_id);

INSERT INTO public.collection_periods (period_key)
SELECT to_char(current_date, 'YYYY-MM')
WHERE NOT EXISTS (
  SELECT 1 FROM public.collection_periods WHERE status = 'open'
);

UPDATE public.payments
SET period_id = (SELECT id FROM public.collection_periods WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1)
WHERE period_id IS NULL;

-- Extensible role foundation: the current primary administrator is seeded as Admin.
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'trainer' CHECK (role IN ('admin', 'trainer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE POLICY "user_roles_select_own_or_admin" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE lower(email) = 'shubham@acegym.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

DROP POLICY IF EXISTS "payments_select_all" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_all" ON public.payments;
DROP POLICY IF EXISTS "payments_update_all" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_all" ON public.payments;
CREATE POLICY "payments_admin_select" ON public.payments FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "payments_admin_insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "payments_admin_update" ON public.payments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "payments_admin_delete" ON public.payments FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "collection_periods_select_authenticated" ON public.collection_periods;
DROP POLICY IF EXISTS "collection_periods_insert_authenticated" ON public.collection_periods;
DROP POLICY IF EXISTS "collection_periods_update_authenticated" ON public.collection_periods;
CREATE POLICY "collection_periods_admin_select" ON public.collection_periods FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "collection_periods_admin_insert" ON public.collection_periods FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "collection_periods_admin_update" ON public.collection_periods FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
