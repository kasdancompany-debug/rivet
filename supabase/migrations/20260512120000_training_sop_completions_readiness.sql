-- Per-SOP training completions and owner-managed delegation readiness.

CREATE TYPE public.readiness_badge AS ENUM (
  'not_ready',
  'learning',
  'ready_with_support',
  'fully_ready'
);

CREATE TABLE public.employee_training_sop_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  training_item_id uuid NOT NULL REFERENCES public.training_items (id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_training_sop_completions_unique UNIQUE (employee_id, training_item_id)
);

CREATE INDEX idx_training_sop_completions_employee
ON public.employee_training_sop_completions (employee_id);

CREATE INDEX idx_training_sop_completions_item
ON public.employee_training_sop_completions (training_item_id);

CREATE TABLE public.employee_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  open_alone public.readiness_badge NOT NULL DEFAULT 'not_ready',
  close_alone public.readiness_badge NOT NULL DEFAULT 'not_ready',
  train_others public.readiness_badge NOT NULL DEFAULT 'not_ready',
  handle_complaints public.readiness_badge NOT NULL DEFAULT 'not_ready',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_readiness_employee_unique UNIQUE (employee_id)
);

CREATE INDEX idx_employee_readiness_business ON public.employee_readiness (business_id);

ALTER TABLE public.employee_training_sop_completions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.employee_readiness ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- employee_training_sop_completions
-- ---------------------------------------------------------------------------

CREATE POLICY "employee_training_sop_completions_select"
ON public.employee_training_sop_completions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.training_items ti
    INNER JOIN public.training_modules m ON m.id = ti.module_id
    WHERE ti.id = employee_training_sop_completions.training_item_id
      AND public.user_can_access_business (m.business_id)
  )
);

CREATE POLICY "employee_training_sop_completions_insert"
ON public.employee_training_sop_completions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.training_items ti
    INNER JOIN public.training_modules m ON m.id = ti.module_id
    INNER JOIN public.profiles p ON p.id = employee_training_sop_completions.employee_id
    WHERE ti.id = employee_training_sop_completions.training_item_id
      AND p.business_id = m.business_id
      AND public.user_can_access_business (m.business_id)
  )
  AND (
    employee_training_sop_completions.employee_id = (SELECT auth.uid())
    OR public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p2
      INNER JOIN public.businesses b ON b.id = p2.business_id
      WHERE p2.id = employee_training_sop_completions.employee_id
        AND b.owner_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "employee_training_sop_completions_delete"
ON public.employee_training_sop_completions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.training_items ti
    INNER JOIN public.training_modules m ON m.id = ti.module_id
    WHERE ti.id = employee_training_sop_completions.training_item_id
      AND public.user_can_access_business (m.business_id)
  )
  AND (
    employee_training_sop_completions.employee_id = (SELECT auth.uid())
    OR public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.profiles p2
      INNER JOIN public.businesses b ON b.id = p2.business_id
      WHERE p2.id = employee_training_sop_completions.employee_id
        AND b.owner_id = (SELECT auth.uid())
    )
  )
);

-- ---------------------------------------------------------------------------
-- employee_readiness (owner-managed)
-- ---------------------------------------------------------------------------

CREATE POLICY "employee_readiness_select"
ON public.employee_readiness
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "employee_readiness_insert"
ON public.employee_readiness
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = employee_id
      AND p.business_id = business_id
  )
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = employee_readiness.business_id
        AND b.owner_id = (SELECT auth.uid())
    )
  )
);

CREATE POLICY "employee_readiness_update"
ON public.employee_readiness
FOR UPDATE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = employee_readiness.employee_id
      AND p.business_id = employee_readiness.business_id
  )
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = employee_readiness.business_id
        AND b.owner_id = (SELECT auth.uid())
    )
  )
)
WITH CHECK (
  public.user_can_access_business (business_id)
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = employee_id
      AND p.business_id = business_id
  )
);

CREATE POLICY "employee_readiness_delete"
ON public.employee_readiness
FOR DELETE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = employee_readiness.business_id
        AND b.owner_id = (SELECT auth.uid())
    )
  )
);
