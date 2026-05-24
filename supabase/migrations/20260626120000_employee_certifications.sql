-- Module certifications: module completion + quiz pass + manager sign-off

CREATE TABLE public.employee_module_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  training_module_id uuid NOT NULL REFERENCES public.training_modules (id) ON DELETE CASCADE,
  module_completed_at timestamptz,
  quizzes_passed_at timestamptz,
  manager_signed_off_at timestamptz,
  manager_signed_off_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  certified_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_module_certifications_unique UNIQUE (employee_id, training_module_id)
);

CREATE INDEX idx_employee_module_certifications_employee
ON public.employee_module_certifications (employee_id);

CREATE INDEX idx_employee_module_certifications_business
ON public.employee_module_certifications (business_id);

ALTER TABLE public.employee_module_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_module_certifications_select"
ON public.employee_module_certifications
FOR SELECT
USING (
  employee_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = employee_module_certifications.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "employee_module_certifications_insert"
ON public.employee_module_certifications
FOR INSERT
WITH CHECK (
  employee_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = employee_module_certifications.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "employee_module_certifications_update"
ON public.employee_module_certifications
FOR UPDATE
USING (
  employee_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = employee_module_certifications.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  employee_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = employee_module_certifications.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
);
