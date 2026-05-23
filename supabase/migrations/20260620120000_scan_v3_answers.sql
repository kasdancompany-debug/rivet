-- Rivet Scan v3: store full answer payload for reporting.

ALTER TABLE public.scan_leads
  ADD COLUMN IF NOT EXISTS scan_answers jsonb;

COMMENT ON COLUMN public.scan_leads.scan_answers IS 'Full v3 scan answers JSON (staff questions, texts/calls, training consistency, etc.).';
