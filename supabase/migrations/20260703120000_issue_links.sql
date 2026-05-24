-- Issue relationships: link bottlenecks to SOPs, training, owner pulls, staff

CREATE TYPE public.issue_link_kind AS ENUM (
  'standard',
  'training_module',
  'owner_interruption',
  'staff_member'
);

CREATE TABLE public.issue_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bottleneck_id uuid NOT NULL REFERENCES public.bottlenecks (id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  kind public.issue_link_kind NOT NULL,
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT issue_links_unique UNIQUE (bottleneck_id, kind, target_id)
);

CREATE INDEX idx_issue_links_bottleneck_id ON public.issue_links (bottleneck_id);

CREATE INDEX idx_issue_links_business_id ON public.issue_links (business_id);

ALTER TABLE public.issue_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "issue_links_select"
ON public.issue_links
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "issue_links_insert"
ON public.issue_links
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND EXISTS (
    SELECT 1
    FROM public.bottlenecks b
    WHERE b.id = bottleneck_id
      AND b.business_id = business_id
  )
);

CREATE POLICY "issue_links_delete"
ON public.issue_links
FOR DELETE
TO authenticated
USING (public.user_can_access_business (business_id));
