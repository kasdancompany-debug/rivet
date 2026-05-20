-- Rivet one-time (lifetime) Stripe purchases per workspace.
-- Rows are inserted/updated only from the Stripe webhook (service role).

CREATE TABLE public.rivet_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  purchaser_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  stripe_customer_id text,
  stripe_checkout_session_id text NOT NULL,
  stripe_payment_intent_id text,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'cad',
  status text NOT NULL DEFAULT 'pending',
  purchased_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now (),
  updated_at timestamptz NOT NULL DEFAULT now (),
  CONSTRAINT rivet_purchases_status_check CHECK (
    status IN ('pending', 'paid', 'canceled', 'refunded')
  ),
  CONSTRAINT rivet_purchases_stripe_checkout_session_id_key UNIQUE (stripe_checkout_session_id)
);

CREATE INDEX idx_rivet_purchases_business_id ON public.rivet_purchases (business_id);

CREATE INDEX idx_rivet_purchases_business_paid ON public.rivet_purchases (business_id)
WHERE
  status = 'paid';

COMMENT ON TABLE public.rivet_purchases IS 'Stripe Checkout one-time Rivet license; access when status=paid for business_id.';

ALTER TABLE public.rivet_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rivet_purchases_select"
ON public.rivet_purchases
FOR SELECT
TO authenticated
USING (public.user_can_access_business (business_id));
