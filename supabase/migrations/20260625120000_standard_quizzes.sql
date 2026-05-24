-- Auto-generated SOP quizzes + employee quiz completion records

ALTER TABLE public.standards
ADD COLUMN IF NOT EXISTS quiz_questions jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE public.employee_standard_quiz_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  standard_id uuid NOT NULL REFERENCES public.standards (id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_standard_quiz_completions_unique UNIQUE (employee_id, standard_id)
);

CREATE INDEX idx_employee_standard_quiz_completions_employee
ON public.employee_standard_quiz_completions (employee_id);

CREATE INDEX idx_employee_standard_quiz_completions_standard
ON public.employee_standard_quiz_completions (standard_id);

ALTER TABLE public.employee_standard_quiz_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_standard_quiz_completions_select"
ON public.employee_standard_quiz_completions
FOR SELECT
USING (
  employee_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = employee_standard_quiz_completions.business_id
      AND b.owner_id = (SELECT auth.uid())
  )
);

CREATE POLICY "employee_standard_quiz_completions_insert"
ON public.employee_standard_quiz_completions
FOR INSERT
WITH CHECK (
  employee_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.standards s
    WHERE s.id = employee_standard_quiz_completions.standard_id
      AND s.business_id = employee_standard_quiz_completions.business_id
  )
);

CREATE POLICY "employee_standard_quiz_completions_update"
ON public.employee_standard_quiz_completions
FOR UPDATE
USING (employee_id = (SELECT auth.uid()))
WITH CHECK (employee_id = (SELECT auth.uid()));
