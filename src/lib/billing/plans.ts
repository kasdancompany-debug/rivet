/**
 * Rivet billing plans — founder lifetime (grandfathered) and future subscription tiers.
 * Marketing copy: `@/lib/pricing-copy` · founder promises: `@/lib/billing/founder-offer`.
 */

export const RIVET_BILLING_PLAN = {
  founder_lifetime: "founder_lifetime",
  /** Reserved for a future monthly Core tier — not sold yet. */
  subscription_core: "subscription_core",
  /** Reserved for a future Pro tier — not sold yet. */
  subscription_pro: "subscription_pro",
} as const

export type RivetBillingPlanId = (typeof RIVET_BILLING_PLAN)[keyof typeof RIVET_BILLING_PLAN]

/** Stripe Checkout metadata + rivet_purchases.product_plan for the current founder offer. */
export const FOUNDER_LIFETIME_CHECKOUT_PRODUCT = "rivet_founder_lifetime_v1" as const

/** Legacy checkout sessions before product id rename — still grandfathered. */
export const LEGACY_LIFETIME_CHECKOUT_PRODUCT = "rivet_lifetime_v1" as const

const FOUNDER_CHECKOUT_PRODUCTS = new Set<string>([
  FOUNDER_LIFETIME_CHECKOUT_PRODUCT,
  LEGACY_LIFETIME_CHECKOUT_PRODUCT,
])

export function isFounderLifetimeCheckoutProduct(product: string | null | undefined): boolean {
  if (!product?.trim()) return false
  return FOUNDER_CHECKOUT_PRODUCTS.has(product.trim())
}

export function checkoutProductToBillingPlan(
  product: string | null | undefined
): RivetBillingPlanId | null {
  if (isFounderLifetimeCheckoutProduct(product)) {
    return RIVET_BILLING_PLAN.founder_lifetime
  }
  return null
}

/** Default plan for Rivet-issued founder checkout sessions (metadata always sets this today). */
export function defaultFounderCheckoutBillingPlan(): RivetBillingPlanId {
  return RIVET_BILLING_PLAN.founder_lifetime
}

export function isFounderLifetimeBillingPlan(plan: string | null | undefined): boolean {
  return plan === RIVET_BILLING_PLAN.founder_lifetime
}

/** Founder workspaces keep full Core access permanently — never downgraded by future tiers. */
export function isFounderGrandfathered(input: {
  billingPlan: string | null | undefined
  founderGrandfatheredAt: string | null | undefined
}): boolean {
  if (input.founderGrandfatheredAt) return true
  return isFounderLifetimeBillingPlan(input.billingPlan)
}

export type FutureSubscriptionPlanId =
  | typeof RIVET_BILLING_PLAN.subscription_core
  | typeof RIVET_BILLING_PLAN.subscription_pro

/** Placeholder catalog for upcoming recurring tiers (Stripe Price IDs wired later). */
export const FUTURE_SUBSCRIPTION_PLANS: Record<
  FutureSubscriptionPlanId,
  { label: string; envPriceIdKey: string; grandfatheredFounderBypass: true }
> = {
  [RIVET_BILLING_PLAN.subscription_core]: {
    label: "Rivet Core (subscription)",
    envPriceIdKey: "STRIPE_RIVET_CORE_MONTHLY_PRICE_ID",
    grandfatheredFounderBypass: true,
  },
  [RIVET_BILLING_PLAN.subscription_pro]: {
    label: "Rivet Pro (subscription)",
    envPriceIdKey: "STRIPE_RIVET_PRO_MONTHLY_PRICE_ID",
    grandfatheredFounderBypass: true,
  },
}

export function isFutureSubscriptionPlan(plan: string | null | undefined): plan is FutureSubscriptionPlanId {
  return plan === RIVET_BILLING_PLAN.subscription_core || plan === RIVET_BILLING_PLAN.subscription_pro
}

export type BillingPlanCatalogEntry = {
  id: RivetBillingPlanId
  label: string
  kind: "founder_lifetime" | "subscription"
  sold: boolean
  permanentlyGrandfathered: boolean
}

/** Single catalog for UI, webhooks, and future Stripe Price wiring. */
export const BILLING_PLAN_CATALOG: Record<RivetBillingPlanId, BillingPlanCatalogEntry> = {
  [RIVET_BILLING_PLAN.founder_lifetime]: {
    id: RIVET_BILLING_PLAN.founder_lifetime,
    label: "Founder Lifetime Access",
    kind: "founder_lifetime",
    sold: true,
    permanentlyGrandfathered: true,
  },
  [RIVET_BILLING_PLAN.subscription_core]: {
    id: RIVET_BILLING_PLAN.subscription_core,
    label: "Rivet Core",
    kind: "subscription",
    sold: false,
    permanentlyGrandfathered: false,
  },
  [RIVET_BILLING_PLAN.subscription_pro]: {
    id: RIVET_BILLING_PLAN.subscription_pro,
    label: "Rivet Pro",
    kind: "subscription",
    sold: false,
    permanentlyGrandfathered: false,
  },
}
