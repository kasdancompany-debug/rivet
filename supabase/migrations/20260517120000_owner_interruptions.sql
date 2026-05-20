-- Owner Interruptions: staff-logged pulls back to the owner (approval, judgment, escalation, etc.)

CREATE TYPE public.owner_interruption_kind AS ENUM (
  'staff_ping',
  'approval_request',
  'judgment_call',
  'unresolved_issue',
  'owner_escalation'
);

CREATE TABLE public.owner_interruptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  logged_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  kind public.owner_interruption_kind NOT NULL,
  summary text NOT NULL,
  detail text,
  estimated_minutes smallint NOT NULL DEFAULT 15,
  related_issue_id uuid REFERENCES public.issues (id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT owner_interruptions_summary_len CHECK (char_length(summary) <= 280),
  CONSTRAINT owner_interruptions_estimated CHECK (estimated_minutes BETWEEN 1 AND 240)
);

CREATE INDEX idx_owner_interruptions_business_occurred
  ON public.owner_interruptions (business_id, occurred_at DESC);

CREATE INDEX idx_owner_interruptions_business_kind
  ON public.owner_interruptions (business_id, kind);

ALTER TABLE public.owner_interruptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_interruptions_select"
ON public.owner_interruptions
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "owner_interruptions_insert"
ON public.owner_interruptions
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND logged_by = (SELECT auth.uid())
);

CREATE POLICY "owner_interruptions_update"
ON public.owner_interruptions
FOR UPDATE
TO authenticated
USING (public.user_can_access_business (business_id))
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "owner_interruptions_delete"
ON public.owner_interruptions
FOR DELETE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    logged_by = (SELECT auth.uid())
    OR public.auth_user_is_owner ()
  )
);
