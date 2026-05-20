-- Stripe subscription fields for Rivet v1 paywall (updated by webhook using service role).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'none';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check CHECK (
  subscription_status IN (
    'none',
    'active',
    'trialing',
    'past_due',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'unpaid'
  )
);

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles (subscription_status);

COMMENT ON COLUMN public.profiles.subscription_status IS 'Stripe-driven access; none until checkout or webhook.';
