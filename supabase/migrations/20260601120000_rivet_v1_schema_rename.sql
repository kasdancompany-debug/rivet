-- Rivet v1: canonical entity names, business_members, team_members, standard_media,
-- subscriptions, execution_* renames, training_progress, updated_at columns,
-- RLS via membership (owners always included).

-- ---------------------------------------------------------------------------
-- ENUM: standard status (rename from sop_status)
-- ---------------------------------------------------------------------------

ALTER TYPE public.sop_status RENAME TO standard_status;

-- ---------------------------------------------------------------------------
-- businesses: updated_at
-- ---------------------------------------------------------------------------

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now ();

DROP TRIGGER IF EXISTS businesses_set_updated_at ON public.businesses;
CREATE TRIGGER businesses_set_updated_at
BEFORE UPDATE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

-- ---------------------------------------------------------------------------
-- profiles: updated_at (stripe columns moved to subscriptions in this migration)
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now ();

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

-- ---------------------------------------------------------------------------
-- business_members: who belongs to which business
-- ---------------------------------------------------------------------------

CREATE TYPE public.business_member_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE public.business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.business_member_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT business_members_business_user_unique UNIQUE (business_id, user_id)
);

CREATE INDEX idx_business_members_user_id ON public.business_members (user_id);

CREATE INDEX idx_business_members_business_id ON public.business_members (business_id);

INSERT INTO public.business_members (business_id, user_id, role)
SELECT b.id, b.owner_id, 'owner'::public.business_member_role
FROM public.businesses b
ON CONFLICT (business_id, user_id) DO NOTHING;

INSERT INTO public.business_members (business_id, user_id, role)
SELECT p.business_id, p.id,
  CASE WHEN p.is_owner OR p.id = b.owner_id THEN 'owner'::public.business_member_role ELSE 'member'::public.business_member_role END
FROM public.profiles p
JOIN public.businesses b ON b.id = p.business_id
WHERE p.business_id IS NOT NULL
ON CONFLICT (business_id, user_id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- team_members: people on the floor (linked profile when they have a login)
-- ---------------------------------------------------------------------------

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  display_name text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT team_members_business_profile_unique UNIQUE (business_id, profile_id)
);

CREATE INDEX idx_team_members_business_id ON public.team_members (business_id);

INSERT INTO public.team_members (business_id, profile_id, display_name)
SELECT p.business_id, p.id, p.full_name
FROM public.profiles p
WHERE
  p.business_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.team_members t
    WHERE t.business_id = p.business_id
      AND t.profile_id = p.id
  );

-- ---------------------------------------------------------------------------
-- subscriptions (Stripe); migrate off profiles then drop billing columns
-- ---------------------------------------------------------------------------

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  business_id uuid REFERENCES public.businesses (id) ON DELETE SET NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'none',
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT subscriptions_status_check CHECK (
    status IN (
      'none',
      'active',
      'trialing',
      'past_due',
      'canceled',
      'incomplete',
      'incomplete_expired',
      'unpaid'
    )
  )
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions (user_id);

CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions (stripe_customer_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE
      table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'subscription_status'
  ) THEN
    INSERT INTO public.subscriptions (user_id, business_id, stripe_customer_id, stripe_subscription_id, status, created_at, updated_at)
    SELECT
      p.id,
      p.business_id,
      p.stripe_customer_id,
      p.stripe_subscription_id,
      COALESCE(NULLIF(trim(p.subscription_status::text), ''), 'none'),
      p.created_at,
      now()
    FROM public.profiles p
    WHERE
      p.stripe_customer_id IS NOT NULL
      OR p.stripe_subscription_id IS NOT NULL
      OR COALESCE(p.subscription_status::text, 'none') <> 'none';
  END IF;
END $$;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS stripe_customer_id;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS stripe_subscription_id;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_status;

-- ---------------------------------------------------------------------------
-- Replace RLS helper: membership + legacy owner match
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
    FROM public.business_members m
    WHERE m.business_id = p_business_id
      AND m.user_id = (SELECT auth.uid ())
  )
  OR EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = p_business_id
      AND b.owner_id = (SELECT auth.uid ())
  );
$$;

-- ---------------------------------------------------------------------------
-- sops → standards, sop_steps → standard_steps
-- ---------------------------------------------------------------------------

ALTER TABLE public.sop_steps DROP CONSTRAINT IF EXISTS sop_steps_sop_id_fkey;

ALTER TABLE public.training_items DROP CONSTRAINT IF EXISTS training_items_sop_id_fkey;

DROP POLICY IF EXISTS "sops_select" ON public.sops;
DROP POLICY IF EXISTS "sops_insert" ON public.sops;
DROP POLICY IF EXISTS "sops_update" ON public.sops;
DROP POLICY IF EXISTS "sops_delete" ON public.sops;
DROP POLICY IF EXISTS "sop_steps_select" ON public.sop_steps;
DROP POLICY IF EXISTS "sop_steps_insert" ON public.sop_steps;
DROP POLICY IF EXISTS "sop_steps_update" ON public.sop_steps;
DROP POLICY IF EXISTS "sop_steps_delete" ON public.sop_steps;

DROP TRIGGER IF EXISTS sops_set_updated_at ON public.sops;

ALTER TABLE public.sops RENAME TO standards;

ALTER TABLE public.standards RENAME CONSTRAINT sops_pkey TO standards_pkey;

ALTER TABLE public.standards RENAME CONSTRAINT sops_importance_level_check TO standards_importance_level_check;

ALTER TABLE public.standards RENAME CONSTRAINT sops_owner_dependency_level_check TO standards_owner_dependency_level_check;

ALTER INDEX idx_sops_business_id RENAME TO idx_standards_business_id;

ALTER INDEX idx_sops_business_status RENAME TO idx_standards_business_status;

ALTER TABLE public.sop_steps RENAME COLUMN sop_id TO standard_id;

ALTER TABLE public.sop_steps RENAME TO standard_steps;

ALTER TABLE public.standard_steps RENAME CONSTRAINT sop_steps_pkey TO standard_steps_pkey;

ALTER TABLE public.standard_steps RENAME CONSTRAINT sop_steps_order_positive TO standard_steps_order_positive;

ALTER TABLE public.standard_steps DROP CONSTRAINT IF EXISTS sop_steps_sop_order_unique;

ALTER TABLE public.standard_steps
ADD CONSTRAINT standard_steps_standard_order_unique UNIQUE (standard_id, step_order);

ALTER TABLE public.standard_steps
ADD CONSTRAINT standard_steps_standard_id_fkey FOREIGN KEY (standard_id) REFERENCES public.standards (id) ON DELETE CASCADE;

ALTER INDEX idx_sop_steps_sop_id RENAME TO idx_standard_steps_standard_id;

ALTER TABLE public.standard_steps
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now ();

DROP TRIGGER IF EXISTS standard_steps_set_updated_at ON public.standard_steps;
CREATE TRIGGER standard_steps_set_updated_at
BEFORE UPDATE ON public.standard_steps
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

CREATE TRIGGER standards_set_updated_at
BEFORE UPDATE ON public.standards
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

ALTER TABLE public.standards ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.standard_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "standards_select"
ON public.standards
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "standards_insert"
ON public.standards
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND created_by = (SELECT auth.uid ())
);

CREATE POLICY "standards_update"
ON public.standards
FOR UPDATE
TO authenticated
USING (public.user_can_access_business (business_id))
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "standards_delete"
ON public.standards
FOR DELETE
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "standard_steps_select"
ON public.standard_steps
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.standards s
    WHERE s.id = standard_steps.standard_id
      AND public.user_can_access_business (s.business_id)
  )
);

CREATE POLICY "standard_steps_insert"
ON public.standard_steps
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.standards s
    WHERE s.id = standard_steps.standard_id
      AND public.user_can_access_business (s.business_id)
  )
);

CREATE POLICY "standard_steps_update"
ON public.standard_steps
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.standards s
    WHERE s.id = standard_steps.standard_id
      AND public.user_can_access_business (s.business_id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.standards s
    WHERE s.id = standard_steps.standard_id
      AND public.user_can_access_business (s.business_id)
  )
);

CREATE POLICY "standard_steps_delete"
ON public.standard_steps
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.standards s
    WHERE s.id = standard_steps.standard_id
      AND public.user_can_access_business (s.business_id)
  )
);

-- training_items.standard_id
ALTER TABLE public.training_items RENAME COLUMN sop_id TO standard_id;

ALTER TABLE public.training_items DROP CONSTRAINT IF EXISTS training_items_module_sop_unique;

ALTER TABLE public.training_items
ADD CONSTRAINT training_items_module_standard_unique UNIQUE (module_id, standard_id);

ALTER TABLE public.training_items
ADD CONSTRAINT training_items_standard_id_fkey FOREIGN KEY (standard_id) REFERENCES public.standards (id) ON DELETE CASCADE;

-- employee_training_sop_completions FK name update (still references training_items)
-- ---------------------------------------------------------------------------
-- standard_media
-- ---------------------------------------------------------------------------

CREATE TABLE public.standard_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  standard_id uuid NOT NULL REFERENCES public.standards (id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'image',
  storage_path text,
  public_url text,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT standard_media_kind_check CHECK (kind IN ('image', 'video', 'file'))
);

CREATE INDEX idx_standard_media_standard_id ON public.standard_media (standard_id);

CREATE INDEX idx_standard_media_business_id ON public.standard_media (business_id);

ALTER TABLE public.standard_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "standard_media_select"
ON public.standard_media
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "standard_media_insert"
ON public.standard_media
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND EXISTS (
    SELECT 1
    FROM public.standards s
    WHERE s.id = standard_id
      AND s.business_id = business_id
  )
);

CREATE POLICY "standard_media_update"
ON public.standard_media
FOR UPDATE
TO authenticated
USING (public.user_can_access_business (business_id))
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "standard_media_delete"
ON public.standard_media
FOR DELETE
TO authenticated
USING (public.user_can_access_business (business_id));

-- ---------------------------------------------------------------------------
-- issues → bottlenecks
-- ---------------------------------------------------------------------------

ALTER TABLE public.owner_interruptions DROP CONSTRAINT IF EXISTS owner_interruptions_related_issue_id_fkey;

DROP POLICY IF EXISTS "issues_select" ON public.issues;
DROP POLICY IF EXISTS "issues_insert" ON public.issues;
DROP POLICY IF EXISTS "issues_update" ON public.issues;
DROP POLICY IF EXISTS "issues_delete" ON public.issues;

ALTER TABLE public.issues RENAME TO bottlenecks;

ALTER TABLE public.bottlenecks RENAME CONSTRAINT issues_pkey TO bottlenecks_pkey;

ALTER INDEX idx_issues_business_id RENAME TO idx_bottlenecks_business_id;

ALTER INDEX idx_issues_business_status RENAME TO idx_bottlenecks_business_status;

ALTER INDEX IF EXISTS idx_issues_daily_run_id RENAME TO idx_bottlenecks_execution_record_id;

ALTER TABLE public.owner_interruptions RENAME COLUMN related_issue_id TO related_bottleneck_id;

ALTER TABLE public.owner_interruptions
ADD CONSTRAINT owner_interruptions_related_bottleneck_id_fkey FOREIGN KEY (related_bottleneck_id) REFERENCES public.bottlenecks (id) ON DELETE SET NULL;

ALTER TABLE public.bottlenecks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bottlenecks_select"
ON public.bottlenecks
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "bottlenecks_insert"
ON public.bottlenecks
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND reported_by = (SELECT auth.uid ())
);

CREATE POLICY "bottlenecks_update"
ON public.bottlenecks
FOR UPDATE
TO authenticated
USING (public.user_can_access_business (business_id))
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "bottlenecks_delete"
ON public.bottlenecks
FOR DELETE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    reported_by = (SELECT auth.uid ())
    OR public.auth_user_is_owner ()
  )
);

ALTER TABLE public.bottlenecks
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now ();

DROP TRIGGER IF EXISTS bottlenecks_set_updated_at ON public.bottlenecks;
CREATE TRIGGER bottlenecks_set_updated_at
BEFORE UPDATE ON public.bottlenecks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

-- ---------------------------------------------------------------------------
-- dependency_assessments → reality_checks
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "dependency_assessments_select" ON public.dependency_assessments;
DROP POLICY IF EXISTS "dependency_assessments_insert" ON public.dependency_assessments;
DROP POLICY IF EXISTS "dependency_assessments_update" ON public.dependency_assessments;
DROP POLICY IF EXISTS "dependency_assessments_delete" ON public.dependency_assessments;

ALTER TABLE public.dependency_assessments RENAME TO reality_checks;

ALTER TABLE public.reality_checks RENAME CONSTRAINT dependency_assessments_pkey TO reality_checks_pkey;

ALTER INDEX idx_dependency_assessments_business_id RENAME TO idx_reality_checks_business_id;

ALTER INDEX idx_dependency_assessments_created RENAME TO idx_reality_checks_created;

ALTER TABLE public.reality_checks
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now ();

DROP TRIGGER IF EXISTS reality_checks_set_updated_at ON public.reality_checks;
CREATE TRIGGER reality_checks_set_updated_at
BEFORE UPDATE ON public.reality_checks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

ALTER TABLE public.reality_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reality_checks_select"
ON public.reality_checks
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "reality_checks_insert"
ON public.reality_checks
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_id
        AND b.owner_id = (SELECT auth.uid ())
    )
  )
);

CREATE POLICY "reality_checks_update"
ON public.reality_checks
FOR UPDATE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_id
        AND b.owner_id = (SELECT auth.uid ())
    )
  )
)
WITH CHECK (
  public.user_can_access_business (business_id)
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_id
        AND b.owner_id = (SELECT auth.uid ())
    )
  )
);

CREATE POLICY "reality_checks_delete"
ON public.reality_checks
FOR DELETE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = business_id
        AND b.owner_id = (SELECT auth.uid ())
    )
  )
);

-- ---------------------------------------------------------------------------
-- daily_runs → execution_records, daily_run_items → execution_record_items
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "daily_runs_select" ON public.daily_runs;
DROP POLICY IF EXISTS "daily_runs_insert" ON public.daily_runs;
DROP POLICY IF EXISTS "daily_runs_update" ON public.daily_runs;
DROP POLICY IF EXISTS "daily_runs_delete" ON public.daily_runs;
DROP POLICY IF EXISTS "daily_run_items_select" ON public.daily_run_items;
DROP POLICY IF EXISTS "daily_run_items_insert" ON public.daily_run_items;
DROP POLICY IF EXISTS "daily_run_items_update" ON public.daily_run_items;
DROP POLICY IF EXISTS "daily_run_items_delete" ON public.daily_run_items;

ALTER TABLE public.bottlenecks DROP CONSTRAINT IF EXISTS issues_daily_run_id_fkey;

ALTER TABLE public.daily_run_items DROP CONSTRAINT IF EXISTS daily_run_items_daily_run_id_fkey;

ALTER TABLE public.daily_runs RENAME TO execution_records;

ALTER TABLE public.execution_records RENAME CONSTRAINT daily_runs_pkey TO execution_records_pkey;

ALTER INDEX idx_daily_runs_business_id RENAME TO idx_execution_records_business_id;

ALTER INDEX idx_daily_runs_employee_id RENAME TO idx_execution_records_employee_id;

DROP INDEX IF EXISTS daily_runs_one_in_progress_per_shift;

CREATE UNIQUE INDEX execution_records_one_in_progress_per_shift
ON public.execution_records (checklist_id, business_id, shift_date)
WHERE status = 'in_progress';

ALTER TABLE public.daily_run_items RENAME COLUMN daily_run_id TO execution_record_id;

ALTER TABLE public.daily_run_items RENAME TO execution_record_items;

ALTER TABLE public.execution_record_items RENAME CONSTRAINT daily_run_items_pkey TO execution_record_items_pkey;

ALTER TABLE public.execution_record_items DROP CONSTRAINT IF EXISTS daily_run_items_unique;

ALTER TABLE public.execution_record_items
ADD CONSTRAINT execution_record_items_unique UNIQUE (execution_record_id, checklist_item_id);

ALTER INDEX idx_daily_run_items_run_id RENAME TO idx_execution_record_items_run_id;

ALTER TABLE public.execution_record_items
ADD CONSTRAINT execution_record_items_execution_record_id_fkey FOREIGN KEY (execution_record_id) REFERENCES public.execution_records (id) ON DELETE CASCADE;

ALTER TABLE public.bottlenecks
ADD CONSTRAINT bottlenecks_daily_run_id_fkey FOREIGN KEY (daily_run_id) REFERENCES public.execution_records (id) ON DELETE SET NULL;

ALTER TABLE public.bottlenecks RENAME COLUMN daily_run_id TO execution_record_id;

ALTER TABLE public.bottlenecks DROP CONSTRAINT IF EXISTS bottlenecks_daily_run_id_fkey;

ALTER TABLE public.bottlenecks
ADD CONSTRAINT bottlenecks_execution_record_id_fkey FOREIGN KEY (execution_record_id) REFERENCES public.execution_records (id) ON DELETE SET NULL;

ALTER TABLE public.execution_records
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now ();

DROP TRIGGER IF EXISTS execution_records_set_updated_at ON public.execution_records;
CREATE TRIGGER execution_records_set_updated_at
BEFORE UPDATE ON public.execution_records
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

ALTER TABLE public.execution_record_items
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now ();

DROP TRIGGER IF EXISTS execution_record_items_set_updated_at ON public.execution_record_items;
CREATE TRIGGER execution_record_items_set_updated_at
BEFORE UPDATE ON public.execution_record_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

ALTER TABLE public.execution_records ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.execution_record_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "execution_records_select"
ON public.execution_records
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "execution_records_insert"
ON public.execution_records
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_can_access_business (business_id)
  AND EXISTS (
    SELECT 1
    FROM public.daily_checklists c
    WHERE c.id = checklist_id
      AND c.business_id = business_id
  )
);

CREATE POLICY "execution_records_update"
ON public.execution_records
FOR UPDATE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    employee_id = (SELECT auth.uid ())
    OR public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = execution_records.business_id
        AND b.owner_id = (SELECT auth.uid ())
    )
    OR status = 'in_progress'
  )
)
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "execution_records_delete"
ON public.execution_records
FOR DELETE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    employee_id = (SELECT auth.uid ())
    OR public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = execution_records.business_id
        AND b.owner_id = (SELECT auth.uid ())
    )
  )
);

CREATE POLICY "execution_record_items_select"
ON public.execution_record_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.execution_records r
    WHERE r.id = execution_record_items.execution_record_id
      AND public.user_can_access_business (r.business_id)
  )
);

CREATE POLICY "execution_record_items_insert"
ON public.execution_record_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.execution_records r
    WHERE r.id = execution_record_id
      AND public.user_can_access_business (r.business_id)
      AND (
        r.employee_id = (SELECT auth.uid ())
        OR public.auth_user_is_owner ()
        OR EXISTS (
          SELECT 1
          FROM public.businesses b
          WHERE b.id = r.business_id
            AND b.owner_id = (SELECT auth.uid ())
        )
        OR r.status = 'in_progress'
      )
  )
);

CREATE POLICY "execution_record_items_update"
ON public.execution_record_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.execution_records r
    WHERE r.id = execution_record_items.execution_record_id
      AND public.user_can_access_business (r.business_id)
      AND (
        r.employee_id = (SELECT auth.uid ())
        OR public.auth_user_is_owner ()
        OR EXISTS (
          SELECT 1
          FROM public.businesses b
          WHERE b.id = r.business_id
            AND b.owner_id = (SELECT auth.uid ())
        )
        OR r.status = 'in_progress'
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.execution_records r
    WHERE r.id = execution_record_id
      AND public.user_can_access_business (r.business_id)
  )
);

CREATE POLICY "execution_record_items_delete"
ON public.execution_record_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.execution_records r
    WHERE r.id = execution_record_items.execution_record_id
      AND public.user_can_access_business (r.business_id)
      AND (
        r.employee_id = (SELECT auth.uid ())
        OR public.auth_user_is_owner ()
        OR EXISTS (
          SELECT 1
          FROM public.businesses b
          WHERE b.id = r.business_id
            AND b.owner_id = (SELECT auth.uid ())
        )
      )
  )
);

-- ---------------------------------------------------------------------------
-- employee_training_progress → training_progress + business_id
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "employee_training_progress_select" ON public.employee_training_progress;
DROP POLICY IF EXISTS "employee_training_progress_insert" ON public.employee_training_progress;
DROP POLICY IF EXISTS "employee_training_progress_update" ON public.employee_training_progress;
DROP POLICY IF EXISTS "employee_training_progress_delete" ON public.employee_training_progress;

ALTER TABLE public.employee_training_progress
ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses (id) ON DELETE CASCADE;

UPDATE public.employee_training_progress etp
SET
  business_id = tm.business_id
FROM
  public.training_modules tm
WHERE
  tm.id = etp.training_module_id
  AND etp.business_id IS NULL;

ALTER TABLE public.employee_training_progress
ALTER COLUMN business_id SET NOT NULL;

ALTER TABLE public.employee_training_progress RENAME TO training_progress;

ALTER TABLE public.training_progress RENAME CONSTRAINT employee_training_progress_pkey TO training_progress_pkey;

ALTER TABLE public.training_progress RENAME CONSTRAINT employee_training_progress_unique TO training_progress_unique;

ALTER INDEX idx_employee_training_progress_employee RENAME TO idx_training_progress_employee;

ALTER INDEX idx_employee_training_progress_module RENAME TO idx_training_progress_module;

CREATE INDEX idx_training_progress_business_id ON public.training_progress (business_id);

ALTER TABLE public.training_progress
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now ();

DROP TRIGGER IF EXISTS training_progress_set_updated_at ON public.training_progress;
CREATE TRIGGER training_progress_set_updated_at
BEFORE UPDATE ON public.training_progress
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_progress_select"
ON public.training_progress
FOR SELECT
TO authenticated
USING (
  employee_id = (SELECT auth.uid ())
  OR public.user_can_access_business (business_id)
);

CREATE POLICY "training_progress_insert"
ON public.training_progress
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
    employee_id = (SELECT auth.uid ())
    OR public.auth_user_is_owner ()
  )
  AND business_id IN (
    SELECT m2.business_id
    FROM public.training_modules m2
    WHERE m2.id = training_module_id
  )
);

CREATE POLICY "training_progress_update"
ON public.training_progress
FOR UPDATE
TO authenticated
USING (
  employee_id = (SELECT auth.uid ())
  OR (
    public.auth_user_is_owner ()
    AND EXISTS (
      SELECT 1
      FROM public.training_modules m
      WHERE m.id = training_module_id
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

CREATE POLICY "training_progress_delete"
ON public.training_progress
FOR DELETE
TO authenticated
USING (
  employee_id = (SELECT auth.uid ())
  OR (
    public.auth_user_is_owner ()
    AND EXISTS (
      SELECT 1
      FROM public.training_modules m
      WHERE m.id = training_module_id
        AND public.user_can_access_business (m.business_id)
    )
  )
);

-- training_items policies reference sops → standards (PostgreSQL rewrites via table rename?)
-- Recreate training_items policies that mention sops
DROP POLICY IF EXISTS "training_items_select" ON public.training_items;
DROP POLICY IF EXISTS "training_items_insert" ON public.training_items;
DROP POLICY IF EXISTS "training_items_update" ON public.training_items;
DROP POLICY IF EXISTS "training_items_delete" ON public.training_items;

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
    FROM public.standards s
    WHERE s.id = training_items.standard_id
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
    FROM public.standards s
    WHERE s.id = training_items.standard_id
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
-- owner_interruptions: updated_at + RLS unchanged pattern
-- ---------------------------------------------------------------------------

ALTER TABLE public.owner_interruptions
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now ();

DROP TRIGGER IF EXISTS owner_interruptions_set_updated_at ON public.owner_interruptions;
CREATE TRIGGER owner_interruptions_set_updated_at
BEFORE UPDATE ON public.owner_interruptions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at ();

-- ---------------------------------------------------------------------------
-- business_members + team_members + subscriptions RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business_members_select"
ON public.business_members
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "business_members_insert"
ON public.business_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = business_id
      AND (
        b.owner_id = (SELECT auth.uid ())
        OR public.auth_user_is_owner ()
      )
  )
);

CREATE POLICY "business_members_update"
ON public.business_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = business_id
      AND b.owner_id = (SELECT auth.uid ())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = business_id
      AND b.owner_id = (SELECT auth.uid ())
  )
);

CREATE POLICY "business_members_delete"
ON public.business_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.businesses b
    WHERE b.id = business_id
      AND b.owner_id = (SELECT auth.uid ())
  )
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_members_select"
ON public.team_members
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));

CREATE POLICY "team_members_insert"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "team_members_update"
ON public.team_members
FOR UPDATE
TO authenticated
USING (public.user_can_access_business (business_id))
WITH CHECK (public.user_can_access_business (business_id));

CREATE POLICY "team_members_delete"
ON public.team_members
FOR DELETE
TO authenticated
USING (public.user_can_access_business (business_id));

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid ()));

CREATE POLICY "subscriptions_insert_own"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid ()));

CREATE POLICY "subscriptions_update_own"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid ()))
WITH CHECK (user_id = (SELECT auth.uid ()));

CREATE POLICY "subscriptions_delete_own"
ON public.subscriptions
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid ()));

-- Service role bypasses RLS for webhooks (uses service key).
