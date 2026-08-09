-- Ace-Gym: allow the custom UPI + Cash payment type on member records.
ALTER TABLE public.members
  DROP CONSTRAINT IF EXISTS members_payment_type_check;

ALTER TABLE public.members
  ADD CONSTRAINT members_payment_type_check
  CHECK (payment_type IN ('UPI', 'Cash', 'UPI + Cash', 'Half UPI + Half Cash'));
