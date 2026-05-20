-- Rivet Scan v2: owner dependency score, severity, cost estimates.

ALTER TABLE public.scan_leads
  ADD COLUMN IF NOT EXISTS owner_dependency_score integer,
  ADD COLUMN IF NOT EXISTS severity text,
  ADD COLUMN IF NOT EXISTS est_interruptions_month integer,
  ADD COLUMN IF NOT EXISTS est_hours_lost_month integer,
  ADD COLUMN IF NOT EXISTS est_annual_cost integer,
  ADD COLUMN IF NOT EXISTS scan_version text DEFAULT 'v1';

ALTER TABLE public.scan_leads DROP CONSTRAINT IF EXISTS scan_leads_founder_dependency_check;

ALTER TABLE public.scan_leads
  ADD CONSTRAINT scan_leads_founder_dependency_check CHECK (
    founder_dependency IN (
      'Low',
      'Medium',
      'High',
      'Critical',
      'LOW',
      'MODERATE',
      'HIGH',
      'CRITICAL'
    )
  );

ALTER TABLE public.scan_leads DROP CONSTRAINT IF EXISTS scan_leads_owner_interruptions_check;

ALTER TABLE public.scan_leads
  ADD CONSTRAINT scan_leads_owner_interruptions_check CHECK (
    owner_interruptions IN ('rarely', 'weekly', 'daily', 'constantly')
  );

COMMENT ON COLUMN public.scan_leads.rivet_index IS 'v1: structural index (higher=better). v2: stores owner_dependency_score (higher=worse).';
