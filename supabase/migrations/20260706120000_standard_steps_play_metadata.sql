-- Per-step play execution metadata (visual target, mistakes, examples, attached media)

ALTER TABLE public.standard_steps
ADD COLUMN IF NOT EXISTS play_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
