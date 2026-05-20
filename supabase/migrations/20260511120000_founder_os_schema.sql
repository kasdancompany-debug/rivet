-- FounderOS core schema: enums, tables, indexes, RLS
-- Requires: pgcrypto (gen_random_uuid) — enabled by default on Supabase

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------

CREATE TYPE public.sop_status AS ENUM ('draft', 'active', 'archived');

CREATE TYPE public.training_progress_status AS ENUM (
  'not_started',
  'in_progress',
  'completed'
);

CREATE TYPE public.daily_checklist_type AS ENUM (
  'opening',
  'closing',
  'cleaning',
  'production',
  'quality_check'
);

CREATE TYPE public.daily_run_status AS ENUM (
  'in_progress',
  'completed',
  'abandoned'
);

CREATE TYPE public.issue_status AS ENUM ('open', 'in_progress', 'resolved');

-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text NOT NULL DEFAULT 'general',
  owner_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses (id) ON DELETE SET NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'member',
  email text NOT NULL,
  is_owner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.sops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  importance_level smallint NOT NULL DEFAULT 3,
  owner_dependency_level smallint NOT NULL DEFAULT 3,
  estimated_time_minutes integer,
  status public.sop_status NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sops_importance_level_check CHECK (
    importance_level BETWEEN 1 AND 5
  ),
  CONSTRAINT sops_owner_dependency_level_check CHECK (
    owner_dependency_level BETWEEN 1 AND 5
  )
);

CREATE TABLE public.sop_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id uuid NOT NULL REFERENCES public.sops (id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  title text NOT NULL,
  instructions text NOT NULL DEFAULT '',
  media_url text,
  requires_photo_confirmation boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sop_steps_order_positive CHECK (step_order >= 0),
  CONSTRAINT sop_steps_sop_order_unique UNIQUE (sop_id, step_order)
);

CREATE TABLE public.training_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.training_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.training_modules (id) ON DELETE CASCADE,
  sop_id uuid NOT NULL REFERENCES public.sops (id) ON DELETE CASCADE,
  required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT training_items_module_sop_unique UNIQUE (module_id, sop_id)
);

CREATE TABLE public.employee_training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  training_module_id uuid NOT NULL REFERENCES public.training_modules (id) ON DELETE CASCADE,
  status public.training_progress_status NOT NULL DEFAULT 'not_started',
  completed_at timestamptz,
  CONSTRAINT employee_training_progress_unique UNIQUE (employee_id, training_module_id)
);

CREATE TABLE public.daily_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  title text NOT NULL,
  type public.daily_checklist_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.daily_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.daily_checklists (id) ON DELETE CASCADE,
  text text NOT NULL,
  required_photo boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  CONSTRAINT daily_checklist_items_sort_non_negative CHECK (sort_order >= 0)
);

CREATE TABLE public.daily_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.daily_checklists (id) ON DELETE RESTRICT,
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  status public.daily_run_status NOT NULL DEFAULT 'in_progress',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notes text
);

CREATE TABLE public.daily_run_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_run_id uuid NOT NULL REFERENCES public.daily_runs (id) ON DELETE CASCADE,
  checklist_item_id uuid NOT NULL REFERENCES public.daily_checklist_items (id) ON DELETE RESTRICT,
  completed boolean NOT NULL DEFAULT false,
  photo_url text,
  note text,
  completed_at timestamptz,
  CONSTRAINT daily_run_items_unique UNIQUE (daily_run_id, checklist_item_id)
);

CREATE TABLE public.issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT,
  category text NOT NULL DEFAULT 'general',
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  description text,
  status public.issue_status NOT NULL DEFAULT 'open',
  owner_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE public.dependency_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  score numeric(5, 2) NOT NULL,
  assessment_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX idx_profiles_business_id ON public.profiles (business_id);

CREATE INDEX idx_sops_business_id ON public.sops (business_id);

CREATE INDEX idx_sops_business_status ON public.sops (business_id, status);

CREATE INDEX idx_sop_steps_sop_id ON public.sop_steps (sop_id);

CREATE INDEX idx_training_modules_business_id ON public.training_modules (business_id);

CREATE INDEX idx_training_items_module_id ON public.training_items (module_id);

CREATE INDEX idx_training_items_sop_id ON public.training_items (sop_id);

CREATE INDEX idx_employee_training_progress_employee ON public.employee_training_progress (employee_id);

CREATE INDEX idx_employee_training_progress_module ON public.employee_training_progress (training_module_id);

CREATE INDEX idx_daily_checklists_business_id ON public.daily_checklists (business_id);

CREATE INDEX idx_daily_checklist_items_checklist ON public.daily_checklist_items (checklist_id);

CREATE INDEX idx_daily_runs_business_id ON public.daily_runs (business_id);

CREATE INDEX idx_daily_runs_employee_id ON public.daily_runs (employee_id);

CREATE INDEX idx_daily_run_items_run_id ON public.daily_run_items (daily_run_id);

CREATE INDEX idx_issues_business_id ON public.issues (business_id);

CREATE INDEX idx_issues_business_status ON public.issues (business_id, status);

CREATE INDEX idx_dependency_assessments_business_id ON public.dependency_assessments (business_id);

CREATE INDEX idx_dependency_assessments_created ON public.dependency_assessments (business_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at ()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER sops_set_updated_at
BEFORE UPDATE ON public.sops
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS helper functions (SECURITY DEFINER avoids recursion on profiles RLS)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_can_access_business (p_business_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = p_business_id
      AND b.owner_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.business_id = p_business_id
  );
$$;

REVOKE ALL ON FUNCTION public.user_can_access_business (uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.user_can_access_business (uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.current_user_business_id ()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.business_id
  FROM public.profiles p
  WHERE p.id = (SELECT auth.uid());
$$;

REVOKE ALL ON FUNCTION public.current_user_business_id () FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_user_business_id () TO authenticated;

CREATE OR REPLACE FUNCTION public.auth_user_is_owner ()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.is_owner
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.auth_user_is_owner () FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.auth_user_is_owner () TO authenticated;

-- ---------------------------------------------------------------------------
-- ENABLE RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sops ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sop_steps ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.training_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.employee_training_progress ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.daily_checklists ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.daily_checklist_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.daily_runs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.daily_run_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.dependency_assessments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- POLICIES: businesses
-- ---------------------------------------------------------------------------

CREATE POLICY "businesses_select_access"
ON public.businesses
FOR SELECT
TO authenticated
USING (public.user_can_access_business (id));

CREATE POLICY "businesses_insert_owner"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "businesses_update_owner"
ON public.businesses
FOR UPDATE
TO authenticated
USING (owner_id = (SELECT auth.uid()))
WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "businesses_delete_owner"
ON public.businesses
FOR DELETE
TO authenticated
USING (owner_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------------
-- POLICIES: profiles
-- ---------------------------------------------------------------------------

CREATE POLICY "profiles_select_self_or_team"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (
    business_id IS NOT NULL
    AND public.user_can_access_business (business_id)
  )
);

CREATE POLICY "profiles_insert_self"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_update_self_or_owner"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (
    public.auth_user_is_owner ()
    AND business_id IS NOT NULL
    AND business_id = public.current_user_business_id ()
    AND public.user_can_access_business (business_id)
  )
)
WITH CHECK (
  id = (SELECT auth.uid())
  OR (
    public.auth_user_is_owner ()
    AND business_id IS NOT NULL
    AND business_id = public.current_user_business_id ()
    AND public.user_can_access_business (business_id)
  )
);

CREATE POLICY "profiles_delete_self_or_owner"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (
    public.auth_user_is_owner ()
    AND business_id IS NOT NULL
    AND business_id = public.current_user_business_id ()
    AND public.user_can_access_business (business_id)
  )
);

-- ---------------------------------------------------------------------------
-- POLICIES: sops
-- ---------------------------------------------------------------------------

CREATE POLICY "sops_select"
ON public.sops
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "sops_insert"
ON public.sops
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND created_by = (SELECT auth.uid())
);

CREATE POLICY "sops_update"
ON public.sops
FOR UPDATE
TO authenticated
USING (public.user_can_access_business (business_id))
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "sops_delete"
ON public.sops
FOR DELETE
TO authenticated
USING (public.user_can_access_business (business_id));

-- ---------------------------------------------------------------------------
-- POLICIES: sop_steps (via parent sop)
-- ---------------------------------------------------------------------------

CREATE POLICY "sop_steps_select"
ON public.sop_steps
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sops s
    WHERE s.id = sop_steps.sop_id
      AND public.user_can_access_business (s.business_id)
  )
);

CREATE POLICY "sop_steps_insert"
ON public.sop_steps
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.sops s
    WHERE s.id = sop_steps.sop_id
      AND public.user_can_access_business (s.business_id)
  )
);

CREATE POLICY "sop_steps_update"
ON public.sop_steps
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sops s
    WHERE s.id = sop_steps.sop_id
      AND public.user_can_access_business (s.business_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.sops s
    WHERE s.id = sop_steps.sop_id
      AND public.user_can_access_business (s.business_id)
  )
);

CREATE POLICY "sop_steps_delete"
ON public.sop_steps
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sops s
    WHERE s.id = sop_steps.sop_id
      AND public.user_can_access_business (s.business_id)
  )
);

-- ---------------------------------------------------------------------------
-- POLICIES: training_modules
-- ---------------------------------------------------------------------------

CREATE POLICY "training_modules_select"
ON public.training_modules
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "training_modules_insert"
ON public.training_modules
FOR INSERT
TO authenticated
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "training_modules_update"
ON public.training_modules
FOR UPDATE
TO authenticated
USING (public.user_can_access_business (business_id))
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "training_modules_delete"
ON public.training_modules
FOR DELETE
TO authenticated
USING (public.user_can_access_business (business_id));

-- ---------------------------------------------------------------------------
-- POLICIES: training_items (via module business)
-- ---------------------------------------------------------------------------

CREATE POLICY "training_items_select"
ON public.training_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.training_modules m
    WHERE m.id = training_items.module_id
      AND public.user_can_access_business (m.business_id)
  )
);

CREATE POLICY "training_items_insert"
ON public.training_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.training_modules m
    WHERE m.id = training_items.module_id
      AND public.user_can_access_business (m.business_id)
  )
  AND EXISTS (
    SELECT 1
    FROM public.sops s
    WHERE s.id = training_items.sop_id
      AND public.user_can_access_business (s.business_id)
  )
);

CREATE POLICY "training_items_update"
ON public.training_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.training_modules m
    WHERE m.id = training_items.module_id
      AND public.user_can_access_business (m.business_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.training_modules m
    WHERE m.id = training_items.module_id
      AND public.user_can_access_business (m.business_id)
  )
  AND EXISTS (
    SELECT 1
    FROM public.sops s
    WHERE s.id = training_items.sop_id
      AND public.user_can_access_business (s.business_id)
  )
);

CREATE POLICY "training_items_delete"
ON public.training_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.training_modules m
    WHERE m.id = training_items.module_id
      AND public.user_can_access_business (m.business_id)
  )
);

-- ---------------------------------------------------------------------------
-- POLICIES: employee_training_progress
-- ---------------------------------------------------------------------------

CREATE POLICY "employee_training_progress_select"
ON public.employee_training_progress
FOR SELECT
TO authenticated
USING (
  employee_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.training_modules m
    WHERE m.id = employee_training_progress.training_module_id
      AND public.user_can_access_business (m.business_id)
  )
);

CREATE POLICY "employee_training_progress_insert"
ON public.employee_training_progress
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.training_modules m
    INNER JOIN public.profiles emp ON emp.id = employee_id
    WHERE m.id = training_module_id
      AND emp.business_id IS NOT NULL
      AND emp.business_id = m.business_id
      AND public.user_can_access_business (m.business_id)
  )
  AND (
    employee_id = (SELECT auth.uid())
    OR public.auth_user_is_owner ()
  )
);

CREATE POLICY "employee_training_progress_update"
ON public.employee_training_progress
FOR UPDATE
TO authenticated
USING (
  employee_id = (SELECT auth.uid())
  OR (
    public.auth_user_is_owner ()
    AND EXISTS (
      SELECT 1
      FROM public.training_modules m
      WHERE m.id = employee_training_progress.training_module_id
        AND public.user_can_access_business (m.business_id)
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.training_modules m
    WHERE m.id = training_module_id
      AND public.user_can_access_business (m.business_id)
  )
);

CREATE POLICY "employee_training_progress_delete"
ON public.employee_training_progress
FOR DELETE
TO authenticated
USING (
  employee_id = (SELECT auth.uid())
  OR (
    public.auth_user_is_owner ()
    AND EXISTS (
      SELECT 1
      FROM public.training_modules m
      WHERE m.id = employee_training_progress.training_module_id
        AND public.user_can_access_business (m.business_id)
    )
  )
);

-- ---------------------------------------------------------------------------
-- POLICIES: daily_checklists
-- ---------------------------------------------------------------------------

CREATE POLICY "daily_checklists_select"
ON public.daily_checklists
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "daily_checklists_insert"
ON public.daily_checklists
FOR INSERT
TO authenticated
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "daily_checklists_update"
ON public.daily_checklists
FOR UPDATE
TO authenticated
USING (public.user_can_access_business (business_id))
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "daily_checklists_delete"
ON public.daily_checklists
FOR DELETE
TO authenticated
USING (public.user_can_access_business (business_id));

-- ---------------------------------------------------------------------------
-- POLICIES: daily_checklist_items
-- ---------------------------------------------------------------------------

CREATE POLICY "daily_checklist_items_select"
ON public.daily_checklist_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.daily_checklists c
    WHERE c.id = daily_checklist_items.checklist_id
      AND public.user_can_access_business (c.business_id)
  )
);

CREATE POLICY "daily_checklist_items_insert"
ON public.daily_checklist_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.daily_checklists c
    WHERE c.id = daily_checklist_items.checklist_id
      AND public.user_can_access_business (c.business_id)
  )
);

CREATE POLICY "daily_checklist_items_update"
ON public.daily_checklist_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.daily_checklists c
    WHERE c.id = daily_checklist_items.checklist_id
      AND public.user_can_access_business (c.business_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.daily_checklists c
    WHERE c.id = daily_checklist_items.checklist_id
      AND public.user_can_access_business (c.business_id)
  )
);

CREATE POLICY "daily_checklist_items_delete"
ON public.daily_checklist_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.daily_checklists c
    WHERE c.id = daily_checklist_items.checklist_id
      AND public.user_can_access_business (c.business_id)
  )
);

-- ---------------------------------------------------------------------------
-- POLICIES: daily_runs
-- ---------------------------------------------------------------------------

CREATE POLICY "daily_runs_select"
ON public.daily_runs
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "daily_runs_insert"
ON public.daily_runs
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND employee_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1
    FROM public.daily_checklists c
    WHERE c.id = daily_runs.checklist_id
      AND c.business_id = daily_runs.business_id
  )
);

CREATE POLICY "daily_runs_update"
ON public.daily_runs
FOR UPDATE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    employee_id = (SELECT auth.uid())
    OR public.auth_user_is_owner ()
  )
)
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "daily_runs_delete"
ON public.daily_runs
FOR DELETE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    employee_id = (SELECT auth.uid())
    OR public.auth_user_is_owner ()
  )
);

-- ---------------------------------------------------------------------------
-- POLICIES: daily_run_items
-- ---------------------------------------------------------------------------

CREATE POLICY "daily_run_items_select"
ON public.daily_run_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.daily_runs r
    WHERE r.id = daily_run_items.daily_run_id
      AND public.user_can_access_business (r.business_id)
  )
);

CREATE POLICY "daily_run_items_insert"
ON public.daily_run_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.daily_runs r
    WHERE r.id = daily_run_items.daily_run_id
      AND public.user_can_access_business (r.business_id)
      AND (
        r.employee_id = (SELECT auth.uid())
        OR public.auth_user_is_owner ()
      )
  )
);

CREATE POLICY "daily_run_items_update"
ON public.daily_run_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.daily_runs r
    WHERE r.id = daily_run_items.daily_run_id
      AND public.user_can_access_business (r.business_id)
      AND (
        r.employee_id = (SELECT auth.uid())
        OR public.auth_user_is_owner ()
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.daily_runs r
    WHERE r.id = daily_run_items.daily_run_id
      AND public.user_can_access_business (r.business_id)
  )
);

CREATE POLICY "daily_run_items_delete"
ON public.daily_run_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.daily_runs r
    WHERE r.id = daily_run_items.daily_run_id
      AND public.user_can_access_business (r.business_id)
      AND (
        r.employee_id = (SELECT auth.uid())
        OR public.auth_user_is_owner ()
      )
  )
);

-- ---------------------------------------------------------------------------
-- POLICIES: issues
-- ---------------------------------------------------------------------------

CREATE POLICY "issues_select"
ON public.issues
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "issues_insert"
ON public.issues
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND reported_by = (SELECT auth.uid())
);

CREATE POLICY "issues_update"
ON public.issues
FOR UPDATE
TO authenticated
USING (public.user_can_access_business (business_id))
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "issues_delete"
ON public.issues
FOR DELETE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    reported_by = (SELECT auth.uid())
    OR public.auth_user_is_owner ()
  )
);

-- ---------------------------------------------------------------------------
-- POLICIES: dependency_assessments
-- ---------------------------------------------------------------------------

CREATE POLICY "dependency_assessments_select"
ON public.dependency_assessments
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "dependency_assessments_insert"
ON public.dependency_assessments
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND public.auth_user_is_owner ()
);

CREATE POLICY "dependency_assessments_update"
ON public.dependency_assessments
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

CREATE POLICY "dependency_assessments_delete"
ON public.dependency_assessments
FOR DELETE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND public.auth_user_is_owner ()
);
