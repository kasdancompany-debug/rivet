-- Issue workflow statuses + ownership fields on bottlenecks

ALTER TABLE public.bottlenecks
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.bottlenecks
  ALTER COLUMN status TYPE text USING status::text;

DROP TYPE public.issue_status;

CREATE TYPE public.issue_status AS ENUM (
  'not_started',
  'investigating',
  'fix_in_progress',
  'resolved'
);

ALTER TABLE public.bottlenecks
  ALTER COLUMN status TYPE public.issue_status USING (
    CASE status
      WHEN 'open' THEN 'not_started'::public.issue_status
      WHEN 'in_progress' THEN 'fix_in_progress'::public.issue_status
      WHEN 'resolved' THEN 'resolved'::public.issue_status
      ELSE 'not_started'::public.issue_status
    END
  );

ALTER TABLE public.bottlenecks
  ALTER COLUMN status SET DEFAULT 'not_started'::public.issue_status;

ALTER TABLE public.bottlenecks
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_date date;

CREATE INDEX IF NOT EXISTS idx_bottlenecks_owner_id ON public.bottlenecks (owner_id);

CREATE INDEX IF NOT EXISTS idx_bottlenecks_business_due_date
  ON public.bottlenecks (business_id, due_date);
