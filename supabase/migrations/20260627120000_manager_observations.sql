-- Manager floor observations on employee timeline; feed readiness calculations.

CREATE TYPE public.manager_observation_type AS ENUM (
  'positive',
  'improvement',
  'critical'
);

CREATE TABLE public.employee_manager_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  observed_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  observation_type public.manager_observation_type NOT NULL,
  notes text NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_manager_observations_notes_nonempty CHECK (char_length(trim(notes)) >= 3)
);

CREATE INDEX idx_employee_manager_observations_employee
ON public.employee_manager_observations (employee_id, observed_at DESC);

CREATE INDEX idx_employee_manager_observations_business
ON public.employee_manager_observations (business_id, observed_at DESC);

ALTER TABLE public.employee_manager_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_manager_observations_select"
ON public.employee_manager_observations
FOR SELECT
USING (
  employee_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = employee_manager_observations.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "employee_manager_observations_insert"
ON public.employee_manager_observations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = employee_manager_observations.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
);
