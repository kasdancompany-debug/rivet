CREATE TYPE public.owner_interruption_urgency AS ENUM (
  'can_wait',
  'today',
  'time_sensitive',
  'right_now'
);

ALTER TABLE public.owner_interruptions
  ADD COLUMN urgency public.owner_interruption_urgency NOT NULL DEFAULT 'today';

CREATE INDEX owner_interruptions_business_urgency_idx
  ON public.owner_interruptions (business_id, urgency);
