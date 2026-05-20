-- Daily Operations: shift date, per-item completer, issue linkage, team in-progress edits.

-- ---------------------------------------------------------------------------
-- COLUMNS
-- ---------------------------------------------------------------------------

ALTER TABLE public.daily_runs
ADD COLUMN IF NOT EXISTS shift_date date;

UPDATE public.daily_runs
SET shift_date = (started_at AT TIME ZONE 'UTC')::date
WHERE shift_date IS NULL;

ALTER TABLE public.daily_runs
ALTER COLUMN shift_date SET DEFAULT (((now() AT TIME ZONE 'utc'))::date);

ALTER TABLE public.daily_runs
ALTER COLUMN shift_date SET NOT NULL;

ALTER TABLE public.daily_run_items
ADD COLUMN IF NOT EXISTS completed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.issues
ADD COLUMN IF NOT EXISTS daily_run_id uuid REFERENCES public.daily_runs (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_issues_daily_run_id ON public.issues (daily_run_id);

CREATE UNIQUE INDEX IF NOT EXISTS daily_runs_one_in_progress_per_shift
ON public.daily_runs (checklist_id, business_id, shift_date)
WHERE status = 'in_progress';

-- ---------------------------------------------------------------------------
-- RLS: team members may update checklist items on in-progress runs; business
-- owner (businesses.owner_id) matches policies even if profile.is_owner false.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "daily_runs_update" ON public.daily_runs;

CREATE POLICY "daily_runs_update"
ON public.daily_runs
FOR UPDATE
TO authenticated
USING (
  public.user_can_access_business (business_id)
  AND (
    employee_id = (SELECT auth.uid())
    OR public.auth_user_is_owner ()
    OR EXISTS (
      SELECT 1
      FROM public.businesses b
      WHERE b.id = daily_runs.business_id
        AND b.owner_id = (SELECT auth.uid())
    )
    OR status = 'in_progress'
  )
)
WITH CHECK (public.user_can_access_business (business_id));

DROP POLICY IF EXISTS "daily_run_items_insert" ON public.daily_run_items;

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
        OR EXISTS (
          SELECT 1
          FROM public.businesses b
          WHERE b.id = r.business_id
            AND b.owner_id = (SELECT auth.uid())
        )
        OR r.status = 'in_progress'
      )
  )
);

DROP POLICY IF EXISTS "daily_run_items_update" ON public.daily_run_items;

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
        OR EXISTS (
          SELECT 1
          FROM public.businesses b
          WHERE b.id = r.business_id
            AND b.owner_id = (SELECT auth.uid())
        )
        OR r.status = 'in_progress'
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

DROP POLICY IF EXISTS "daily_run_items_delete" ON public.daily_run_items;

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
        OR EXISTS (
          SELECT 1
          FROM public.businesses b
          WHERE b.id = r.business_id
            AND b.owner_id = (SELECT auth.uid())
        )
        OR r.status = 'in_progress'
      )
  )
);
