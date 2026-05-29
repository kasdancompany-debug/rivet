-- Founder checkout payment schedule (once vs 3× installment) — same grandfathering either way.

ALTER TABLE public.rivet_purchases
ADD COLUMN IF NOT EXISTS payment_option text;

ALTER TABLE public.rivet_purchases
DROP CONSTRAINT IF EXISTS rivet_purchases_payment_option_check;

ALTER TABLE public.rivet_purchases
ADD CONSTRAINT rivet_purchases_payment_option_check CHECK (
  payment_option IS NULL
  OR payment_option IN ('once', 'installment_3')
);

COMMENT ON COLUMN public.rivet_purchases.payment_option IS
  'How the founder offer was purchased: once ($799) or installment_3 (3×$299). Access is identical when paid.';
