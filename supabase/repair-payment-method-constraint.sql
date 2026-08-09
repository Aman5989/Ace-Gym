-- Ace-Gym: allow the custom mixed payment method.
-- This changes only the validation rule; it does not delete or modify payment rows.

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_payment_method_check
  CHECK (
    payment_method IN (
      'UPI',
      'Cash',
      'UPI + Cash',
      'Half UPI + Half Cash',
      'Card',
      'Bank Transfer'
    )
  );
