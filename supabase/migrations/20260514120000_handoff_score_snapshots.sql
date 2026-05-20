-- Rivet Index: daily snapshots for trend history (table name historical: handoff_score_snapshots).

CREATE TABLE public.handoff_score_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  dependency_score smallint NOT NULL,
  autonomy_score smallint NOT NULL,
  category_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  critical_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT handoff_score_snapshots_dependency_range CHECK (
    dependency_score BETWEEN 0 AND 100
  ),
  CONSTRAINT handoff_score_snapshots_autonomy_range CHECK (
    autonomy_score BETWEEN 0 AND 100
  ),
  CONSTRAINT handoff_score_snapshots_business_day UNIQUE (business_id, snapshot_date)
);

CREATE INDEX idx_handoff_score_snapshots_business_day ON public.handoff_score_snapshots (
  business_id,
  snapshot_date DESC
);

ALTER TABLE public.handoff_score_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "handoff_score_snapshots_select"
ON public.handoff_score_snapshots
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "handoff_score_snapshots_insert"
ON public.handoff_score_snapshots
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND public.auth_user_is_owner ()
);

CREATE POLICY "handoff_score_snapshots_update"
ON public.handoff_score_snapshots
FOR UPDATE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND public.auth_user_is_owner ()
)
WITH CHECK (
  public.user_can_access_business (business_id)
  AND public.auth_user_is_owner ()
);

CREATE POLICY "handoff_score_snapshots_delete"
ON public.handoff_score_snapshots
FOR DELETE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND public.auth_user_is_owner ()
);
