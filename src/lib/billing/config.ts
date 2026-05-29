import {
  getBillingReadiness,
  isBillingFullyConfigured,
  logBillingReadinessInDevelopment,
  missingBillingEnvVars,
  shouldEnforceBillingGate,
} from "@/lib/billing/billing-readiness"
import { isInternalDiagnosticsPath } from "@/lib/onboarding/paths"

export {
  getBillingReadiness,
  missingBillingEnvVars,
  shouldEnforceBillingGate,
  type BillingReadiness,
  type RequiredBillingEnvVar,
} from "@/lib/billing/billing-readiness"

logBillingReadinessInDevelopment()

/**
 * Billing is enforced only when all required Stripe + Supabase pieces are present.
 * Partial configuration (some vars set) still routes unpaid users to /subscribe but
 * blocks Checkout until every var is set.
 */
export function isBillingEnforced(): boolean {
  return isBillingFullyConfigured()
}

export function isBillingExemptPath(pathname: string): boolean {
  if (isInternalDiagnosticsPath(pathname)) return true
  if (pathname === "/login" || pathname === "/signup") return true
  if (pathname.startsWith("/auth")) return true
  if (pathname === "/api/stripe/webhook") return true
  if (pathname === "/subscribe" || pathname.startsWith("/subscribe/")) return true
  if (pathname === "/setup") return true
  if (pathname === "/onboarding") return true
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return true
  if (pathname.startsWith("/learn")) return true
  if (pathname.startsWith("/join")) return true
  return false
}

export function subscriptionAllowsAppAccess(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing"
}

/** Message for Checkout failures; null when billing is ready. */
export function billingCheckoutBlockedMessage(): string | null {
  const readiness = getBillingReadiness()
  if (readiness.status === "ready") return null
  return readiness.message
}
