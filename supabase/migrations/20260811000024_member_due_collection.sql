-- Member due balances and secure due collection.

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS due_amount numeric NOT NULL DEFAULT 0;

UPDATE public.members
SET due_amount = 0
WHERE due_amount IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'members_due_amount_non_negative'
  ) THEN
    ALTER TABLE public.members
      ADD CONSTRAINT members_due_amount_non_negative
      CHECK (due_amount >= 0);
  END IF;
END
$$;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_fee_category_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_fee_category_check
  CHECK (fee_category IN ('registration', 'renewal', 'due', 'adjustment'));

CREATE INDEX IF NOT EXISTS idx_payments_due_category
  ON public.payments(member_id, fee_category, payment_date DESC);

CREATE OR REPLACE FUNCTION public.record_member_due_collection(
  target_member_id uuid,
  target_amount numeric,
  target_payment_method text,
  target_cash_amount numeric,
  target_upi_amount numeric,
  target_payment_date date,
  target_notes text
)
RETURNS TABLE (
  payment_id uuid,
  member_name text,
  remaining_due_amount numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  member_row public.members%ROWTYPE;
  open_period_id uuid;
  created_payment_id uuid;
  remaining_due numeric;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'trainer'
    )
  ) THEN
    RAISE EXCEPTION 'Admin or trainer access required';
  END IF;

  IF target_amount IS NULL OR target_amount <= 0 OR target_payment_date IS NULL THEN
    RAISE EXCEPTION 'A positive amount and payment date are required';
  END IF;

  SELECT m.*
  INTO member_row
  FROM public.members m
  WHERE m.id = target_member_id
  FOR UPDATE;

  IF member_row.id IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF target_amount > COALESCE(member_row.due_amount, 0) THEN
    RAISE EXCEPTION 'Collection cannot exceed the member due amount';
  END IF;

  SELECT cp.id
  INTO open_period_id
  FROM public.collection_periods cp
  WHERE cp.status = 'open'
  ORDER BY cp.opened_at DESC
  LIMIT 1;

  IF open_period_id IS NULL THEN
    RAISE EXCEPTION 'No open collection period is available';
  END IF;

  INSERT INTO public.payments (
    member_id,
    amount,
    payment_method,
    cash_amount,
    upi_amount,
    fee_category,
    payment_date,
    notes,
    period_id
  )
  VALUES (
    target_member_id,
    target_amount,
    target_payment_method,
    target_cash_amount,
    target_upi_amount,
    'due',
    target_payment_date,
    COALESCE(target_notes, 'Due collection'),
    open_period_id
  )
  RETURNING id INTO created_payment_id;

  remaining_due := round(COALESCE(member_row.due_amount, 0) - target_amount, 2);

  UPDATE public.members
  SET due_amount = remaining_due,
      updated_at = now()
  WHERE id = target_member_id;

  RETURN QUERY
  SELECT created_payment_id, member_row.full_name, remaining_due;
END;
$$;

REVOKE ALL ON FUNCTION public.record_member_due_collection(uuid, numeric, text, numeric, numeric, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_member_due_collection(uuid, numeric, text, numeric, numeric, date, text) TO authenticated;
