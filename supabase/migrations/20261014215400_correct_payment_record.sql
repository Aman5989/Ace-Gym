CREATE OR REPLACE FUNCTION public.correct_payment_record(
  target_payment_id uuid,
  target_amount numeric,
  target_payment_method text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  payment_row public.payments%ROWTYPE;
  member_due numeric;
  corrected_due numeric;
  corrected_cash numeric;
  corrected_upi numeric;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;

  IF target_amount IS NULL
    OR target_amount <= 0
    OR target_amount <> round(target_amount, 2)
    OR target_payment_method IS NULL
    OR target_payment_method NOT IN ('UPI', 'Cash')
  THEN
    RAISE EXCEPTION 'A positive amount with up to two decimal places and a valid payment method are required';
  END IF;

  SELECT *
  INTO payment_row
  FROM public.payments
  WHERE id = target_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  corrected_cash := CASE WHEN target_payment_method = 'Cash' THEN target_amount ELSE 0 END;
  corrected_upi := CASE WHEN target_payment_method = 'UPI' THEN target_amount ELSE 0 END;

  IF payment_row.fee_category = 'due' THEN
    SELECT due_amount
    INTO member_due
    FROM public.members
    WHERE id = payment_row.member_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Payment member not found';
    END IF;

    corrected_due := round(COALESCE(member_due, 0) + payment_row.amount - target_amount, 2);
    IF corrected_due < 0 THEN
      RAISE EXCEPTION 'Corrected amount cannot exceed the member outstanding due';
    END IF;

    UPDATE public.members
    SET due_amount = corrected_due,
        updated_at = now()
    WHERE id = payment_row.member_id;
  END IF;

  UPDATE public.payments
  SET amount = target_amount,
      payment_method = target_payment_method,
      cash_amount = corrected_cash,
      upi_amount = corrected_upi
  WHERE id = target_payment_id;

  IF payment_row.period_id IS NOT NULL THEN
    PERFORM 1
    FROM public.collection_periods
    WHERE id = payment_row.period_id
    FOR UPDATE;

    UPDATE public.collection_periods AS period
    SET total_amount = totals.total_amount,
        cash_amount = totals.cash_amount,
        upi_amount = totals.upi_amount,
        payment_count = totals.payment_count,
        registration_amount = totals.registration_amount,
        renewal_amount = totals.renewal_amount,
        registration_count = totals.registration_count,
        renewal_count = totals.renewal_count
    FROM (
      SELECT
        COALESCE(SUM(amount), 0) AS total_amount,
        COALESCE(SUM(cash_amount), 0) AS cash_amount,
        COALESCE(SUM(upi_amount), 0) AS upi_amount,
        COUNT(*)::integer AS payment_count,
        COALESCE(SUM(amount) FILTER (
          WHERE fee_category = 'registration'
            OR (
              fee_category IS NULL
              AND lower(COALESCE(notes, '')) LIKE '%initial membership payment%'
            )
        ), 0) AS registration_amount,
        COALESCE(SUM(amount) FILTER (
          WHERE COALESCE(fee_category, '') <> 'due'
            AND COALESCE(fee_category, '') <> 'registration'
            AND NOT (
              fee_category IS NULL
              AND lower(COALESCE(notes, '')) LIKE '%initial membership payment%'
            )
        ), 0) AS renewal_amount,
        COUNT(*) FILTER (
          WHERE fee_category = 'registration'
            OR (
              fee_category IS NULL
              AND lower(COALESCE(notes, '')) LIKE '%initial membership payment%'
            )
        )::integer AS registration_count,
        COUNT(*) FILTER (
          WHERE COALESCE(fee_category, '') <> 'due'
            AND COALESCE(fee_category, '') <> 'registration'
            AND NOT (
              fee_category IS NULL
              AND lower(COALESCE(notes, '')) LIKE '%initial membership payment%'
            )
        )::integer AS renewal_count
      FROM public.payments
      WHERE period_id = payment_row.period_id
    ) AS totals
    WHERE period.id = payment_row.period_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.correct_payment_record(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.correct_payment_record(uuid, numeric, text) TO authenticated;
