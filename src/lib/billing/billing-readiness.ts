/**
 * Rivet one-time license billing — required server env vars.
 * Paywall + Checkout are enabled only when every key is set.
 */

export const REQUIRED_BILLING_ENV_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_RIVET_ONE_TIME_PRICE_ID",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
] as const

export type RequiredBillingEnvVar = (typeof REQUIRED_BILLING_ENV_VARS)[number]

export type BillingReadinessStatus = "ready" | "off" | "misconfigured"

export type BillingReadiness = {
  status: BillingReadinessStatus
  missing: RequiredBillingEnvVar[]
  /** User-safe or developer-detailed message; null when ready. */
  message: string | null
}

function envSet(key: string): boolean {
  return Boolean(process.env[key]?.trim())
}

/** Explicit kill-switch for QA — skips paywall and checkout when true. */
export function isBillingDisabledByFlag(): boolean {
  const v = process.env.RIVET_BILLING_DISABLED?.trim().toLowerCase()
  return v === "1" || v === "true" || v === "yes"
}

/** Opt-in: paywall runs only when this is true and all billing env vars are set. */
export function isBillingEnforcementExplicitlyEnabled(): boolean {
  const v = process.env.RIVET_BILLING_ENFORCED?.trim().toLowerCase()
  return v === "1" || v === "true" || v === "yes"
}

/** Env vars that are unset among the billing set. */
export function missingBillingEnvVars(): RequiredBillingEnvVar[] {
  return REQUIRED_BILLING_ENV_VARS.filter((key) => !envSet(key))
}

/** True when at least one billing-critical var is set (Stripe or service role). */
export function isBillingIntentStarted(): boolean {
  return (
    envSet("STRIPE_SECRET_KEY") ||
    envSet("STRIPE_RIVET_ONE_TIME_PRICE_ID") ||
    envSet("STRIPE_WEBHOOK_SECRET") ||
    envSet("SUPABASE_SERVICE_ROLE_KEY")
  )
}

function billingUserMessage(missing: RequiredBillingEnvVar[]): string {
  if (process.env.NODE_ENV === "production") {
    return "Checkout is temporarily unavailable. Try again shortly or contact support if this continues."
  }
  return `Billing is not configured. Missing environment variables: ${missing.join(", ")}`
}

function billingMisconfiguredMessage(missing: RequiredBillingEnvVar[]): string {
  if (process.env.NODE_ENV === "production") {
    return "Checkout is temporarily unavailable while payment setup is completed. Try again shortly or contact support."
  }
  return `Billing is partially configured — checkout and webhooks will not work until these are set: ${missing.join(", ")}`
}

export function getBillingReadiness(): BillingReadiness {
  if (isBillingDisabledByFlag()) {
    return {
      status: "off",
      missing: [],
      message: "Billing disabled via RIVET_BILLING_DISABLED (paywall and checkout off).",
    }
  }

  const missing = missingBillingEnvVars()
  if (missing.length === 0) {
    return { status: "ready", missing: [], message: null }
  }
  if (!isBillingIntentStarted()) {
    return { status: "off", missing, message: billingUserMessage(missing) }
  }
  return { status: "misconfigured", missing, message: billingMisconfiguredMessage(missing) }
}

/** Paywall + Checkout enabled only when every required var is present. */
export function isBillingFullyConfigured(): boolean {
  return getBillingReadiness().status === "ready"
}

/** Unpaid users are sent to /subscribe only when enforcement is on and checkout is fully configured. */
export function shouldEnforceBillingGate(): boolean {
  if (isBillingDisabledByFlag()) return false
  if (!isBillingEnforcementExplicitlyEnabled()) return false
  return getBillingReadiness().status === "ready"
}

/** Industry template + Reality Check required before the main app (when billing is enforced). */
export function shouldRequireOnboardingGates(): boolean {
  return shouldEnforceBillingGate()
}

/** Open signup — billing and strict onboarding gates are off. */
export function isOpenAccessMode(): boolean {
  return !shouldEnforceBillingGate()
}

export function logBillingReadinessInDevelopment(): void {
  if (process.env.NODE_ENV === "production") return
  if (isBillingDisabledByFlag()) {
    console.info("[rivet billing] Paywall off — RIVET_BILLING_DISABLED is set.")
    return
  }
  const readiness = getBillingReadiness()
  if (readiness.status === "ready") return
  if (readiness.status === "off") {
    console.info(
      "[rivet billing] Paywall off — set all billing env vars to enforce /subscribe:",
      REQUIRED_BILLING_ENV_VARS.join(", ")
    )
    return
  }
  console.error("[rivet billing] MISCONFIGURED — missing:", readiness.missing.join(", "))
}
