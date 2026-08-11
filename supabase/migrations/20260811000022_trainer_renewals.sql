-- Renewal workflow for Admin and Trainer dashboards.
-- The function performs the payment insert and due-date update atomically,
-- without granting trainers general member or payment-table write access.

CREATE OR REPLACE FUNCTION public.record_member_renewal(
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
  next_due_date date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  member_row public.members%ROWTYPE;
  open_period_id uuid;
  new_due_date date;
  created_payment_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'trainer'
    )
  ) THEN
    RAISE EXCEPTION 'Admin or trainer access required';
  END IF;

  IF target_amount IS NULL OR target_amount <= 0 OR target_payment_date IS NULL THEN
    RAISE EXCEPTION 'A positive amount and payment date are required';
  END IF;

  SELECT m.* INTO member_row
  FROM public.members m
  WHERE m.id = target_member_id
  FOR UPDATE;

  IF member_row.id IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  SELECT cp.id INTO open_period_id
  FROM public.collection_periods cp
  WHERE cp.status = 'open'
  ORDER BY cp.opened_at DESC
  LIMIT 1;

  IF open_period_id IS NULL THEN
    RAISE EXCEPTION 'No open collection period is available';
  END IF;

  new_due_date := (
    GREATEST(member_row.next_due_date, target_payment_date)
    + CASE lower(member_row.membership_plan)
        WHEN 'monthly' THEN interval '1 month'
        WHEN 'quarterly' THEN interval '3 months'
        WHEN 'half yearly' THEN interval '6 months'
        WHEN 'yearly' THEN interval '12 months'
        ELSE interval '1 month'
      END
  )::date;

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
    'renewal',
    target_payment_date,
    target_notes,
    open_period_id
  )
  RETURNING id INTO created_payment_id;

  UPDATE public.members
  SET next_due_date = new_due_date,
      updated_at = now()
  WHERE id = target_member_id;

  RETURN QUERY SELECT created_payment_id, member_row.full_name, new_due_date;
END;
$$;

REVOKE ALL ON FUNCTION public.record_member_renewal(uuid, numeric, text, numeric, numeric, date, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_member_renewal(uuid, numeric, text, numeric, numeric, date, text) TO authenticated;
