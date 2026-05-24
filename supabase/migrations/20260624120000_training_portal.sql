-- Employee training portal: invites, per-SOP progress, public token resolution

CREATE TYPE public.training_invite_channel AS ENUM ('email', 'sms', 'link');

CREATE TABLE public.training_portal_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  training_module_id uuid NOT NULL REFERENCES public.training_modules (id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE,
  recipient_email text,
  recipient_phone text,
  channel public.training_invite_channel NOT NULL DEFAULT 'link',
  created_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  last_opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_training_portal_invites_token ON public.training_portal_invites (token);
CREATE INDEX idx_training_portal_invites_business ON public.training_portal_invites (business_id);
CREATE INDEX idx_training_portal_invites_module ON public.training_portal_invites (training_module_id);

CREATE TABLE public.training_sop_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  training_item_id uuid NOT NULL REFERENCES public.training_items (id) ON DELETE CASCADE,
  step_checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  video_watched_at timestamptz,
  quiz_passed boolean NOT NULL DEFAULT false,
  quiz_answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  photo_proofs jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT training_sop_progress_unique UNIQUE (employee_id, training_item_id)
);

CREATE INDEX idx_training_sop_progress_employee ON public.training_sop_progress (employee_id);
CREATE INDEX idx_training_sop_progress_item ON public.training_sop_progress (training_item_id);

CREATE OR REPLACE FUNCTION public.resolve_training_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.training_portal_invites%ROWTYPE;
  v_module public.training_modules%ROWTYPE;
  v_business public.businesses%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM public.training_portal_invites WHERE token = p_token LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;
  IF v_row.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired', 'moduleId', v_row.training_module_id);
  END IF;

  SELECT * INTO v_module FROM public.training_modules WHERE id = v_row.training_module_id;
  SELECT * INTO v_business FROM public.businesses WHERE id = v_row.business_id;

  UPDATE public.training_portal_invites SET last_opened_at = now() WHERE id = v_row.id;

  RETURN jsonb_build_object(
    'valid', true,
    'inviteId', v_row.id,
    'businessId', v_row.business_id,
    'businessName', coalesce(v_business.name, 'Your workplace'),
    'moduleId', v_row.training_module_id,
    'moduleTitle', coalesce(v_module.title, 'Training module'),
    'moduleDescription', v_module.description,
    'employeeId', v_row.employee_id,
    'recipientEmail', v_row.recipient_email,
    'recipientPhone', v_row.recipient_phone
  );
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_training_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_training_invite(text) TO anon, authenticated;

ALTER TABLE public.training_portal_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sop_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_portal_invites_select"
ON public.training_portal_invites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = training_portal_invites.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
  OR employee_id = (SELECT auth.uid())
);

CREATE POLICY "training_portal_invites_insert"
ON public.training_portal_invites
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = training_portal_invites.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
  AND created_by = (SELECT auth.uid())
);

CREATE POLICY "training_portal_invites_delete"
ON public.training_portal_invites
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = training_portal_invites.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "training_sop_progress_select"
ON public.training_sop_progress
FOR SELECT
USING (
  employee_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = training_sop_progress.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "training_sop_progress_insert"
ON public.training_sop_progress
FOR INSERT
WITH CHECK (
  employee_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.training_items ti
    INNER JOIN public.training_modules m ON m.id = ti.module_id
    WHERE ti.id = training_sop_progress.training_item_id
      AND m.business_id = training_sop_progress.business_id
  )
);

CREATE POLICY "training_sop_progress_update"
ON public.training_sop_progress
FOR UPDATE
USING (employee_id = (SELECT auth.uid()))
WITH CHECK (employee_id = (SELECT auth.uid()));

CREATE POLICY "training_sop_progress_delete"
ON public.training_sop_progress
FOR DELETE
USING (
  employee_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = training_sop_progress.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
);
