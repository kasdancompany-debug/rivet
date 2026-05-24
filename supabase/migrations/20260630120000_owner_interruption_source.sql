CREATE TYPE public.owner_interruption_source AS ENUM (
  'text_message',
  'phone_call',
  'in_person',
  'slack',
  'email',
  'other'
);

ALTER TABLE public.owner_interruptions
  ADD COLUMN source public.owner_interruption_source NOT NULL DEFAULT 'other';

CREATE INDEX owner_interruptions_business_source_idx
  ON public.owner_interruptions (business_id, source);
