-- Idempotent Stripe webhook processing (service role only).

CREATE TABLE public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now ()
);

COMMENT ON TABLE public.stripe_webhook_events IS
  'Processed Stripe event IDs; prevents duplicate webhook side effects.';

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
