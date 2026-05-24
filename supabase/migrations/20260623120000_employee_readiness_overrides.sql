-- Calculated readiness: manager overrides (null = use calculated score)

CREATE TYPE public.delegation_readiness_status AS ENUM ('ready', 'needs_work');

ALTER TABLE public.employee_readiness
ADD COLUMN IF NOT EXISTS open_alone_override public.delegation_readiness_status,
ADD COLUMN IF NOT EXISTS close_alone_override public.delegation_readiness_status,
ADD COLUMN IF NOT EXISTS train_others_override public.delegation_readiness_status,
ADD COLUMN IF NOT EXISTS handle_complaints_override public.delegation_readiness_status;
