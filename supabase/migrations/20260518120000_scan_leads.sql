-- Public marketing scan submissions (no auth). Inserts only via RLS for anon/authenticated.

CREATE TABLE public.scan_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  business_name text NOT NULL,
  website text NOT NULL DEFAULT '',
  industry text NOT NULL,
  employees integer NOT NULL,
  locations integer NOT NULL,
  owner_interruptions text NOT NULL,
  procedures_documented boolean NOT NULL,
  training_published boolean NOT NULL,
  recurring_issues_tracked boolean NOT NULL,
  email text NOT NULL,
  rivet_index integer NOT NULL,
  founder_dependency text NOT NULL,
  execution_drift integer NOT NULL,
  training_fragility integer NOT NULL,
  owner_routing integer NOT NULL,
  CONSTRAINT scan_leads_employees_check CHECK (employees >= 1),
  CONSTRAINT scan_leads_locations_check CHECK (locations >= 1 AND locations <= 99),
  CONSTRAINT scan_leads_rivet_index_check CHECK (rivet_index >= 0 AND rivet_index <= 100),
  CONSTRAINT scan_leads_execution_drift_check CHECK (execution_drift >= 0 AND execution_drift <= 100),
  CONSTRAINT scan_leads_training_fragility_check CHECK (training_fragility >= 0 AND training_fragility <= 100),
  CONSTRAINT scan_leads_owner_routing_check CHECK (owner_routing >= 0 AND owner_routing <= 100),
  CONSTRAINT scan_leads_founder_dependency_check CHECK (
    founder_dependency IN ('Low', 'Medium', 'High', 'Critical')
  ),
  CONSTRAINT scan_leads_owner_interruptions_check CHECK (
    owner_interruptions IN ('rarely', 'weekly', 'daily', 'constantly')
  )
);

CREATE INDEX scan_leads_created_at_idx ON public.scan_leads (created_at DESC);

ALTER TABLE public.scan_leads ENABLE ROW LEVEL SECURITY;

-- Marketing form: anyone may insert a lead; no public read/update/delete.
CREATE POLICY scan_leads_insert_anon ON public.scan_leads
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY scan_leads_insert_authenticated ON public.scan_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE public.scan_leads IS 'Operational /scan form submissions; insert-only for anon via RLS.';

GRANT INSERT ON TABLE public.scan_leads TO anon, authenticated;
