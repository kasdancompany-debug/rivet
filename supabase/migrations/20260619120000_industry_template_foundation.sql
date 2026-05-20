-- Industry template install tracking + workspace playbooks (interruption / issue workflows).

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS industry_template_id text,
  ADD COLUMN IF NOT EXISTS template_installed_at timestamptz;

COMMENT ON COLUMN public.businesses.industry_template_id IS 'Rivet onboarding card id (cafe, restaurant, …).';
COMMENT ON COLUMN public.businesses.template_installed_at IS 'When the industry template bundle was preloaded.';

CREATE TABLE IF NOT EXISTS public.workspace_playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  playbook_type text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  detail text,
  kind text,
  category text,
  severity text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT workspace_playbooks_type_check CHECK (playbook_type IN ('interruption', 'issue'))
);

CREATE INDEX IF NOT EXISTS idx_workspace_playbooks_business ON public.workspace_playbooks (business_id);

ALTER TABLE public.workspace_playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_playbooks_select"
ON public.workspace_playbooks
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "workspace_playbooks_insert"
ON public.workspace_playbooks
FOR INSERT
TO authenticated
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "workspace_playbooks_delete"
ON public.workspace_playbooks
FOR DELETE
TO authenticated
USING (public.user_can_access_business (business_id));
