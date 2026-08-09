-- Ace-Gym: collection periods and Admin/Trainer access control
-- Run this once in Supabase SQL Editor.

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

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS period_id uuid REFERENCES public.collection_periods(id);

CREATE INDEX IF NOT EXISTS idx_payments_period_id
  ON public.payments(period_id);

-- Create an open collection period if none currently exists.
INSERT INTO public.collection_periods (period_key)
SELECT to_char(current_date, 'YYYY-MM')
WHERE NOT EXISTS (
  SELECT 1 FROM public.collection_periods WHERE status = 'open'
);

-- Assign existing ungrouped payments to the current open period.
UPDATE public.payments
SET period_id = (
  SELECT id
  FROM public.collection_periods
  WHERE status = 'open'
  ORDER BY opened_at DESC
  LIMIT 1
)
WHERE period_id IS NULL;

-- User roles: Admin or Trainer.
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'trainer' CHECK (role IN ('admin', 'trainer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Remove policies from earlier attempts so this script is safe to rerun.
DROP POLICY IF EXISTS "user_roles_select_own_or_admin" ON public.user_roles;
DROP POLICY IF EXISTS "payments_select_all" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_all" ON public.payments;
DROP POLICY IF EXISTS "payments_update_all" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_all" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_select" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_insert" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_update" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_delete" ON public.payments;
DROP POLICY IF EXISTS "collection_periods_select_authenticated" ON public.collection_periods;
DROP POLICY IF EXISTS "collection_periods_insert_authenticated" ON public.collection_periods;
DROP POLICY IF EXISTS "collection_periods_update_authenticated" ON public.collection_periods;
DROP POLICY IF EXISTS "collection_periods_admin_select" ON public.collection_periods;
DROP POLICY IF EXISTS "collection_periods_admin_insert" ON public.collection_periods;
DROP POLICY IF EXISTS "collection_periods_admin_update" ON public.collection_periods;

-- Users can see their own role. Admins can see all role assignments.
CREATE POLICY "user_roles_select_own_or_admin"
ON public.user_roles FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles r
    WHERE r.user_id = auth.uid() AND r.role = 'admin'
  )
);

-- Seed the primary administrator.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE lower(email) = 'shubham@acegym.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Only Admins can read or modify payment records.
CREATE POLICY "payments_admin_select"
ON public.payments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

CREATE POLICY "payments_admin_insert"
ON public.payments FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

CREATE POLICY "payments_admin_update"
ON public.payments FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

CREATE POLICY "payments_admin_delete"
ON public.payments FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

-- Only Admins can read or modify collection periods.
CREATE POLICY "collection_periods_admin_select"
ON public.collection_periods FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

CREATE POLICY "collection_periods_admin_insert"
ON public.collection_periods FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));

CREATE POLICY "collection_periods_admin_update"
ON public.collection_periods FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin'));
