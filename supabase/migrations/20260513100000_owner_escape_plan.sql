-- Owner Escape Plan: 30-day founder dependency reduction roadmap

CREATE TABLE public.owner_escape_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  started_on date NOT NULL DEFAULT ((timezone('utc', now())))::date,
  status text NOT NULL DEFAULT 'active',
  CONSTRAINT owner_escape_plans_status_check CHECK (
    status = ANY (ARRAY['active', 'completed', 'archived']::text[])
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX owner_escape_plans_one_active_per_business
ON public.owner_escape_plans (business_id)
WHERE status = 'active';

CREATE INDEX idx_owner_escape_plans_business ON public.owner_escape_plans (business_id, status);

CREATE TRIGGER owner_escape_plans_set_updated_at
BEFORE UPDATE ON public.owner_escape_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

CREATE TABLE public.owner_escape_plan_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.owner_escape_plans (id) ON DELETE CASCADE,
  week_number integer NOT NULL CHECK (week_number >= 1 AND week_number <= 4),
  task_key text,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_owner_escape_plan_tasks_plan
ON public.owner_escape_plan_tasks (plan_id, week_number, sort_order);

ALTER TABLE public.owner_escape_plans ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.owner_escape_plan_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_escape_plans_select"
ON public.owner_escape_plans
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "owner_escape_plans_insert"
ON public.owner_escape_plans
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND created_by = (SELECT auth.uid())
);

CREATE POLICY "owner_escape_plans_update"
ON public.owner_escape_plans
FOR UPDATE
TO authenticated
USING (public.user_can_access_business (business_id))
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "owner_escape_plans_delete"
ON public.owner_escape_plans
FOR DELETE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    public.auth_user_is_owner ()
    OR created_by = (SELECT auth.uid())
  )
);

CREATE POLICY "owner_escape_plan_tasks_select"
ON public.owner_escape_plan_tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.owner_escape_plans p
    WHERE p.id = owner_escape_plan_tasks.plan_id
      AND public.user_can_access_business (p.business_id)
  )
);

CREATE POLICY "owner_escape_plan_tasks_insert"
ON public.owner_escape_plan_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.owner_escape_plans p
    WHERE p.id = owner_escape_plan_tasks.plan_id
      AND public.user_can_access_business (p.business_id)
  )
);

CREATE POLICY "owner_escape_plan_tasks_update"
ON public.owner_escape_plan_tasks
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.owner_escape_plans p
    WHERE p.id = owner_escape_plan_tasks.plan_id
      AND public.user_can_access_business (p.business_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.owner_escape_plans p
    WHERE p.id = owner_escape_plan_tasks.plan_id
      AND public.user_can_access_business (p.business_id)
  )
);

CREATE POLICY "owner_escape_plan_tasks_delete"
ON public.owner_escape_plan_tasks
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.owner_escape_plans p
    WHERE p.id = owner_escape_plan_tasks.plan_id
      AND public.user_can_access_business (p.business_id)
  )
);
