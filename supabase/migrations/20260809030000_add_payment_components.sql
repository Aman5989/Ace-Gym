-- Ace-Gym: store Cash and UPI components separately for accurate collection reporting.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS cash_amount numeric NOT NULL DEFAULT 0 CHECK (cash_amount >= 0),
  ADD COLUMN IF NOT EXISTS upi_amount numeric NOT NULL DEFAULT 0 CHECK (upi_amount >= 0);

-- Backfill legacy payments according to their recorded method.
UPDATE public.payments
SET
  cash_amount = CASE WHEN lower(payment_method) = 'cash' THEN amount ELSE 0 END,
  upi_amount = CASE WHEN lower(payment_method) = 'upi' THEN amount ELSE 0 END
WHERE cash_amount = 0 AND upi_amount = 0;

-- Mixed payments created before component storage are conservatively split equally.
UPDATE public.payments
SET
  cash_amount = ROUND(amount / 2, 2),
  upi_amount = amount - ROUND(amount / 2, 2)
WHERE lower(payment_method) = 'half upi + half cash'
  AND cash_amount = 0
  AND upi_amount = 0;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_component_total_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_component_total_check
  CHECK (cash_amount + upi_amount = amount);
