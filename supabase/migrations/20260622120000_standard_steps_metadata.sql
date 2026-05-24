-- Per-step metadata for capture / execution (estimated time, critical, verification, notes)

ALTER TABLE public.standard_steps
ADD COLUMN IF NOT EXISTS estimated_time_minutes integer,
ADD COLUMN IF NOT EXISTS is_critical boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS verification text,
ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.standard_steps
DROP CONSTRAINT IF EXISTS standard_steps_estimated_time_minutes_check;

ALTER TABLE public.standard_steps
ADD CONSTRAINT standard_steps_estimated_time_minutes_check CHECK (
  estimated_time_minutes IS NULL OR estimated_time_minutes >= 0
);
