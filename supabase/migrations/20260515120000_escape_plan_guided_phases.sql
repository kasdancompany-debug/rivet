-- Guided Owner Escape Plan: intake, 6 phases (week_number reused as phase_number), item kinds

ALTER TABLE public.owner_escape_plans
  ADD COLUMN IF NOT EXISTS intake_json jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.owner_escape_plans
  ADD COLUMN IF NOT EXISTS plan_version integer NOT NULL DEFAULT 1;

UPDATE public.owner_escape_plans SET plan_version = 1 WHERE plan_version IS NULL;

ALTER TABLE public.owner_escape_plan_tasks DROP CONSTRAINT IF EXISTS owner_escape_plan_tasks_week_number_check;

ALTER TABLE public.owner_escape_plan_tasks
  ADD CONSTRAINT owner_escape_plan_tasks_week_number_check CHECK (
    week_number >= 1
    AND week_number <= 6
  );

ALTER TABLE public.owner_escape_plan_tasks
  ADD COLUMN IF NOT EXISTS item_kind text NOT NULL DEFAULT 'operational_task';

UPDATE public.owner_escape_plan_tasks SET item_kind = 'operational_task' WHERE item_kind IS NULL;

ALTER TABLE public.owner_escape_plan_tasks DROP CONSTRAINT IF EXISTS owner_escape_plan_tasks_item_kind_check;

ALTER TABLE public.owner_escape_plan_tasks
  ADD CONSTRAINT owner_escape_plan_tasks_item_kind_check CHECK (
    item_kind = ANY (
      ARRAY[
        'milestone'::text,
        'operational_task'::text,
        'staff_assignment'::text,
        'standard_doc'::text,
        'risk_warning'::text
      ]
    )
  );
