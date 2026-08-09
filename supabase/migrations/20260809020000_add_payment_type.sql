-- Ace-Gym: persist the member's initial payment type and support mixed payments.
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'UPI';

ALTER TABLE public.members
  DROP CONSTRAINT IF EXISTS members_payment_type_check;

ALTER TABLE public.members
  ADD CONSTRAINT members_payment_type_check
  CHECK (payment_type IN ('UPI', 'Cash', 'Half UPI + Half Cash'));

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('UPI', 'Cash', 'Half UPI + Half Cash'));

UPDATE public.members
SET payment_type = 'UPI'
WHERE payment_type IS NULL;

UPDATE public.payments
SET payment_method = 'UPI'
WHERE payment_method IS NULL OR payment_method NOT IN ('UPI', 'Cash', 'Half UPI + Half Cash');
