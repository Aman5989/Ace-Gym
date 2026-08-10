-- ACE々GYM: let trainers take admissions, and track who recorded each payment.
-- Run once in the Supabase SQL Editor. Safe to re-run.
--
-- Design intent:
--   * A trainer may INSERT a payment, but only a registration fee, only for the
--     open period, and only attributed to themselves. They may not edit or
--     delete any payment, and they may not read the ledger.
--   * Renewal fees stay admin-only, matching the existing rule that trainers
--     cannot collect ongoing subscription money.
--   * Every payment records who keyed it in, so admissions taken at the desk by
--     a trainer are auditable.

-- ---------------------------------------------------------------------------
-- 1. Role helper for trainers (mirrors public.is_admin())
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'trainer')
  );
$$;

REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Attribution: who recorded this payment
-- ---------------------------------------------------------------------------
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS recorded_by uuid REFERENCES auth.users(id);

ALTER TABLE public.payments
  ALTER COLUMN recorded_by SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_payments_recorded_by
  ON public.payments(recorded_by);

-- Mirror the same on members, so an admission is traceable to the staff member
-- who took it even before any payment row is considered.
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

ALTER TABLE public.members
  ALTER COLUMN created_by SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_members_created_by
  ON public.members(created_by);

-- ---------------------------------------------------------------------------
-- 3. Payments RLS: narrow trainer insert, admin keeps everything
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "payments_admin_select" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_insert" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_update" ON public.payments;
DROP POLICY IF EXISTS "payments_admin_delete" ON public.payments;
DROP POLICY IF EXISTS "payments_trainer_registration_insert" ON public.payments;
DROP POLICY IF EXISTS "payments_select_own_recorded" ON public.payments;

-- Admin: full read.
CREATE POLICY "payments_admin_select"
ON public.payments FOR SELECT TO authenticated
USING (public.is_admin());

-- Trainer: may read back only the rows they recorded themselves. This is what
-- allows the insert to return the created row, and lets a trainer see their own
-- day's takings without exposing the whole ledger.
CREATE POLICY "payments_select_own_recorded"
ON public.payments FOR SELECT TO authenticated
USING (recorded_by = auth.uid());

-- Admin: may insert anything.
CREATE POLICY "payments_admin_insert"
ON public.payments FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- Trainer: may insert a registration fee only, attributed to themselves, and
-- only into a period that is still open.
CREATE POLICY "payments_trainer_registration_insert"
ON public.payments FOR INSERT TO authenticated
WITH CHECK (
  public.is_staff()
  AND recorded_by = auth.uid()
  AND fee_category = 'registration'
  AND period_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.collection_periods cp
    WHERE cp.id = period_id AND cp.status = 'open'
  )
);

-- Update and delete remain strictly admin-only.
CREATE POLICY "payments_admin_update"
ON public.payments FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "payments_admin_delete"
ON public.payments FOR DELETE TO authenticated
USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Collection periods: trainers need to see and open the current period
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "collection_periods_admin_select" ON public.collection_periods;
DROP POLICY IF EXISTS "collection_periods_admin_insert" ON public.collection_periods;
DROP POLICY IF EXISTS "collection_periods_admin_update" ON public.collection_periods;
DROP POLICY IF EXISTS "collection_periods_staff_select" ON public.collection_periods;
DROP POLICY IF EXISTS "collection_periods_staff_insert" ON public.collection_periods;

-- Any staff member may see periods; a trainer needs the open period id to
-- attach a registration payment to it.
CREATE POLICY "collection_periods_staff_select"
ON public.collection_periods FOR SELECT TO authenticated
USING (public.is_staff());

-- Staff may open a period, but only ever an open one. Closing a month stays
-- admin-only because that is the accounting sign-off.
CREATE POLICY "collection_periods_staff_insert"
ON public.collection_periods FOR INSERT TO authenticated
WITH CHECK (public.is_staff() AND status = 'open');

CREATE POLICY "collection_periods_admin_update"
ON public.collection_periods FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Backfill attribution for existing rows
-- ---------------------------------------------------------------------------
-- Existing history predates attribution. Assign it to the primary admin so the
-- collection screens have something meaningful to show instead of "Unknown".
UPDATE public.payments p
SET recorded_by = (
  SELECT id FROM auth.users WHERE lower(email) = 'shubham@acegym.com' LIMIT 1
)
WHERE p.recorded_by IS NULL;

UPDATE public.members m
SET created_by = (
  SELECT id FROM auth.users WHERE lower(email) = 'shubham@acegym.com' LIMIT 1
)
WHERE m.created_by IS NULL;

-- ---------------------------------------------------------------------------
-- 6. Readable staff names for the collection UI
-- ---------------------------------------------------------------------------
-- No new function is needed: the existing admin_list_user_roles() RPC already
-- returns user_id, email and role for every account, which is exactly what the
-- ledger needs to turn a recorded_by uuid into a staff name.

-- Ensure an open period exists right now so the next admission cannot fail.
INSERT INTO public.collection_periods (period_key, status)
SELECT to_char(current_date, 'YYYY-MM'), 'open'
WHERE NOT EXISTS (
  SELECT 1 FROM public.collection_periods WHERE status = 'open'
);

-- ---------------------------------------------------------------------------
-- 7. Members table: enforce the trainer restrictions in the database
-- ---------------------------------------------------------------------------
-- The members table had no row-level security at all, so the "trainer cannot
-- edit or delete members" rule existed only as hidden buttons in the UI. Anyone
-- holding a trainer session could still change or remove a member by calling the
-- REST API directly. These policies make the rule real.
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_staff_select" ON public.members;
DROP POLICY IF EXISTS "members_staff_insert" ON public.members;
DROP POLICY IF EXISTS "members_admin_update" ON public.members;
DROP POLICY IF EXISTS "members_admin_delete" ON public.members;

-- Both roles need to see the member list to run the gym.
CREATE POLICY "members_staff_select"
ON public.members FOR SELECT TO authenticated
USING (public.is_staff());

-- Both roles may take an admission, attributed to themselves.
CREATE POLICY "members_staff_insert"
ON public.members FOR INSERT TO authenticated
WITH CHECK (public.is_staff() AND created_by = auth.uid());

-- Correcting or removing a member record stays with the administrator.
CREATE POLICY "members_admin_update"
ON public.members FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "members_admin_delete"
ON public.members FOR DELETE TO authenticated
USING (public.is_admin());
