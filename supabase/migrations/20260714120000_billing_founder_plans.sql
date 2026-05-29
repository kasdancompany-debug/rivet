-- Billing plans: founder lifetime (grandfathered) + room for future subscription tiers.

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS billing_plan text,
ADD COLUMN IF NOT EXISTS founder_grandfathered_at timestamptz;

ALTER TABLE public.businesses
ADD CONSTRAINT businesses_billing_plan_check CHECK (
  billing_plan IS NULL
  OR billing_plan IN ('founder_lifetime', 'subscription_core', 'subscription_pro')
);

COMMENT ON COLUMN public.businesses.billing_plan IS
  'Active commercial plan for the workspace. founder_lifetime is permanently grandfathered.';

COMMENT ON COLUMN public.businesses.founder_grandfathered_at IS
  'When set, workspace keeps Founder Lifetime Access regardless of future subscription catalog changes.';

ALTER TABLE public.rivet_purchases
ADD COLUMN IF NOT EXISTS product_plan text NOT NULL DEFAULT 'founder_lifetime';

ALTER TABLE public.rivet_purchases
ADD CONSTRAINT rivet_purchases_product_plan_check CHECK (
  product_plan IN ('founder_lifetime', 'subscription_core', 'subscription_pro')
);

COMMENT ON COLUMN public.rivet_purchases.product_plan IS
  'Commercial plan purchased via Stripe Checkout; founder_lifetime rows grandfather the workspace.';

-- Backfill existing paid founder purchases.
UPDATE public.businesses b
SET
  billing_plan = 'founder_lifetime',
  founder_grandfathered_at = COALESCE(b.founder_grandfathered_at, rp.purchased_at, rp.updated_at)
FROM public.rivet_purchases rp
WHERE
  rp.business_id = b.id
  AND rp.status = 'paid'
  AND (b.billing_plan IS NULL OR b.founder_grandfathered_at IS NULL);

UPDATE public.rivet_purchases
SET product_plan = 'founder_lifetime'
WHERE product_plan IS DISTINCT FROM 'founder_lifetime';
