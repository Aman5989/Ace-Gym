-- Ace-Gym: replace user-facing member profile fields without deleting legacy data.
-- Existing email and emergency_contact columns are retained so no historical data is lost.

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS father_name text,
  ADD COLUMN IF NOT EXISTS address text;

COMMENT ON COLUMN public.members.father_name IS 'Member father or guardian name';
COMMENT ON COLUMN public.members.address IS 'Member residential address';

CREATE INDEX IF NOT EXISTS idx_members_father_name ON public.members (father_name);

-- Existing values are intentionally preserved in their original legacy columns.
-- New and updated records should use father_name and address.
