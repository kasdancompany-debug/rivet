CREATE TYPE public.interruption_action_plan_status AS ENUM (
  'draft',
  'approved',
  'published',
  'dismissed'
);

CREATE TYPE public.interruption_action_fix_type AS ENUM (
  'sop',
  'training_module'
);

CREATE TABLE public.interruption_action_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  interruption_id uuid NOT NULL REFERENCES public.owner_interruptions (id) ON DELETE CASCADE,
  status public.interruption_action_plan_status NOT NULL DEFAULT 'draft',
  fix_type public.interruption_action_fix_type NOT NULL,
  root_cause text NOT NULL,
  suggested_title text NOT NULL,
  suggested_description text,
  related_standard_id uuid REFERENCES public.standards (id) ON DELETE SET NULL,
  related_module_id uuid REFERENCES public.training_modules (id) ON DELETE SET NULL,
  draft_standard_id uuid REFERENCES public.standards (id) ON DELETE SET NULL,
  draft_module_id uuid REFERENCES public.training_modules (id) ON DELETE SET NULL,
  affected_people jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  approved_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interruption_action_plans_one_per_interruption UNIQUE (interruption_id)
);

CREATE INDEX interruption_action_plans_business_status_idx
  ON public.interruption_action_plans (business_id, status);

CREATE TRIGGER interruption_action_plans_updated_at
  BEFORE UPDATE ON public.interruption_action_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.interruption_action_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interruption_action_plans_select"
ON public.interruption_action_plans
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "interruption_action_plans_insert"
ON public.interruption_action_plans
FOR INSERT
TO authenticated
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "interruption_action_plans_update"
ON public.interruption_action_plans
FOR UPDATE
TO authenticated
USING (public.user_can_access_business (business_id))
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "interruption_action_plans_delete"
ON public.interruption_action_plans
FOR DELETE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND public.auth_user_is_owner ()
);
