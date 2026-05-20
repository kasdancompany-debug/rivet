/**
 * Rivet ships with **test** Stripe keys until you explicitly allow live.
 * Set `STRIPE_ALLOW_LIVE_KEYS=true` only after end-to-end test checkout works.
 */
export function assertStripeSecretIsTestMode(secretKey: string): void {
  if (process.env.STRIPE_ALLOW_LIVE_KEYS === "true") return
  if (secretKey.startsWith("sk_live_")) {
    throw new Error(
      "Live Stripe secret key is blocked. Use test keys (sk_test_…) or set STRIPE_ALLOW_LIVE_KEYS=true after verification."
    )
  }
}
