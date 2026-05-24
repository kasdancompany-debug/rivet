-- Issue lifecycle workflow milestones

CREATE TYPE public.issue_lifecycle_stage AS ENUM (
  'logged',
  'pattern_detected',
  'fix_suggested',
  'training_assigned',
  'progress_tracked',
  'dependency_updated'
);

CREATE TABLE public.issue_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bottleneck_id uuid NOT NULL REFERENCES public.bottlenecks (id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  stage public.issue_lifecycle_stage NOT NULL,
  detail text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT issue_lifecycle_events_unique UNIQUE (bottleneck_id, stage)
);

CREATE INDEX idx_issue_lifecycle_events_bottleneck_id
  ON public.issue_lifecycle_events (bottleneck_id);

ALTER TABLE public.issue_lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "issue_lifecycle_events_select"
ON public.issue_lifecycle_events
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "issue_lifecycle_events_insert"
ON public.issue_lifecycle_events
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

CREATE POLICY "issue_lifecycle_events_update"
ON public.issue_lifecycle_events
FOR UPDATE
TO authenticated
USING (public.user_can_access_business (business_id))
WITH CHECK (public.user_can_access_business (business_id));
