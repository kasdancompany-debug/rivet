/**
 * Billing is enforced only when all required Stripe + Supabase pieces are present.
 * Missing any piece disables the paywall so local/dev environments keep working.
 *
 * One-time Rivet license: set `STRIPE_RIVET_ONE_TIME_PRICE_ID` to your **test** Price id
 * (`price_…`) for the $799 CAD Checkout product. Use `sk_test_` keys until
 * `STRIPE_ALLOW_LIVE_KEYS=true` is set deliberately on the server.
 */
export function isBillingEnforced(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_WEBHOOK_SECRET?.trim() &&
      process.env.STRIPE_RIVET_ONE_TIME_PRICE_ID?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  )
}

export function isBillingExemptPath(pathname: string): boolean {
  if (pathname === "/login" || pathname === "/signup") return true
  if (pathname.startsWith("/auth")) return true
  if (pathname === "/api/stripe/webhook") return true
  if (pathname === "/subscribe" || pathname.startsWith("/subscribe/")) return true
  if (pathname === "/setup") return true
  if (pathname === "/onboarding") return true
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return true
  return false
}

export function subscriptionAllowsAppAccess(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing"
}
