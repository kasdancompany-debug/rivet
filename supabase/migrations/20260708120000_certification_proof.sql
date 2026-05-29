-- Track photo proof requirement separately for certification gate

ALTER TABLE public.employee_module_certifications
ADD COLUMN IF NOT EXISTS proof_uploaded_at timestamptz;
