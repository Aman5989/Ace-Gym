-- Ace-Gym: run this once in the Supabase SQL Editor.
-- It upgrades collection accounting so that:
--   1. every payment is tagged as a Registration Fee or a Renewal Fee
--   2. correcting a member's fee also corrects the registration payment
--      (only while the month is still open, so verified months stay intact)
--   3. closed months store the registration/renewal split

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS fee_category text;

UPDATE public.payments
SET fee_category = 'registration'
WHERE fee_category IS NULL
  AND (
    lower(coalesce(notes, '')) LIKE '%initial membership payment%'
    OR lower(coalesce(notes, '')) LIKE '%registration%'
  );

WITH first_payments AS (
  SELECT DISTINCT ON (member_id) id
  FROM public.payments
  ORDER BY member_id, payment_date ASC, created_at ASC
)
UPDATE public.payments p
SET fee_category = 'registration'
FROM first_payments f
WHERE p.id = f.id
  AND p.fee_category IS NULL;

UPDATE public.payments
SET fee_category = 'renewal'
WHERE fee_category IS NULL;

ALTER TABLE public.payments
  ALTER COLUMN fee_category SET DEFAULT 'renewal';

ALTER TABLE public.payments
  ALTER COLUMN fee_category SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_fee_category_check'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_fee_category_check
      CHECK (fee_category IN ('registration', 'renewal', 'adjustment'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_fee_category
  ON public.payments(fee_category);

CREATE INDEX IF NOT EXISTS idx_payments_period_category
  ON public.payments(period_id, fee_category);

ALTER TABLE public.collection_periods
  ADD COLUMN IF NOT EXISTS registration_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS renewal_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS registration_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS renewal_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.sync_registration_payment_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_payment public.payments;
BEGIN
  IF NEW.monthly_fee IS NULL OR NEW.monthly_fee = OLD.monthly_fee THEN
    RETURN NEW;
  END IF;

  SELECT * INTO target_payment
  FROM public.payments
  WHERE member_id = NEW.id
    AND fee_category = 'registration'
  ORDER BY payment_date ASC, created_at ASC
  LIMIT 1;

  IF target_payment.id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.collection_periods cp
    WHERE cp.id = target_payment.period_id AND cp.status = 'closed'
  ) THEN
    RETURN NEW;
  END IF;

  UPDATE public.payments
  SET amount = NEW.monthly_fee,
      cash_amount = CASE
        WHEN target_payment.payment_method = 'Cash' THEN NEW.monthly_fee
        WHEN target_payment.payment_method IN ('UPI + Cash', 'Half UPI + Half Cash') AND coalesce(target_payment.amount, 0) > 0
          THEN round(NEW.monthly_fee * (coalesce(target_payment.cash_amount, 0) / target_payment.amount), 2)
        ELSE 0
      END,
      upi_amount = CASE
        WHEN target_payment.payment_method = 'UPI' THEN NEW.monthly_fee
        WHEN target_payment.payment_method IN ('UPI + Cash', 'Half UPI + Half Cash') AND coalesce(target_payment.amount, 0) > 0
          THEN NEW.monthly_fee - round(NEW.monthly_fee * (coalesce(target_payment.cash_amount, 0) / target_payment.amount), 2)
        ELSE 0
      END,
      payment_method = NEW.payment_type
  WHERE id = target_payment.id;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS members_sync_registration_payment ON public.members;

CREATE TRIGGER members_sync_registration_payment
AFTER UPDATE OF monthly_fee, payment_type ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.sync_registration_payment_amount();
