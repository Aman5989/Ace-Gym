ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS timing text;

UPDATE public.members
SET timing = 'Morning'
WHERE timing IS NULL;

ALTER TABLE public.members
  ALTER COLUMN timing SET DEFAULT 'Morning';

ALTER TABLE public.members
  ADD CONSTRAINT members_timing_check
  CHECK (timing IN ('Morning', 'Evening'));

ALTER TABLE public.members
  ALTER COLUMN timing SET NOT NULL;

COMMENT ON COLUMN public.members.timing IS 'Preferred workout timing: Morning or Evening';

-- If this migration is applied manually in Supabase SQL Editor, run the complete file once.
-- Existing members are assigned Morning by default to preserve their records.
