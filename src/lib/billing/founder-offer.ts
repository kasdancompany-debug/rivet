/**
 * Founder Lifetime Access — canonical commercial offer (marketing + billing identity).
 * Plan id `founder_lifetime` matches `RIVET_BILLING_PLAN` in plans.ts (no import — avoids cycles).
 */

export const FOUNDER_LIFETIME_PRICING = {
  currency: "cad",
  onceAmountCents: 799_00,
  onceDisplay: "$799 CAD once",
  installmentCount: 3,
  installmentAmountCents: 299_00,
  installmentDisplay: "or 3 payments of $299",
  installmentTotalDisplay: "3 payments of $299",
  priceDisplay: "$799",
} as const

/** Promises shown on marketing and checkout — must stay true for grandfathered workspaces. */
export const FOUNDER_LIFETIME_PROMISES = [
  "Lifetime access to Rivet Core",
  "No recurring subscription",
  "Future core updates included",
] as const

export const FOUNDER_GRANDFATHER_CONTRACT = {
  version: 1 as const,
  planId: "founder_lifetime" as const,
  promises: FOUNDER_LIFETIME_PROMISES,
  /**
   * Legal/product contract: workspaces with `founder_grandfathered_at` keep Rivet Core forever.
   * Future `subscription_core` / `subscription_pro` catalog changes must not revoke this access.
   */
  supersedesFutureSubscriptionRequirements: true,
} as const

export type FounderPaymentOption = "once" | "installment_3"

export const FOUNDER_PAYMENT_OPTIONS: Record<
  FounderPaymentOption,
  { label: string; description: string; stripePriceEnvKey: string }
> = {
  once: {
    label: FOUNDER_LIFETIME_PRICING.onceDisplay,
    description: "One payment · lifetime Rivet Core on this workspace",
    stripePriceEnvKey: "STRIPE_RIVET_ONE_TIME_PRICE_ID",
  },
  installment_3: {
    label: FOUNDER_LIFETIME_PRICING.installmentTotalDisplay,
    description: "Three payments · same lifetime access and grandfathering",
    stripePriceEnvKey: "STRIPE_RIVET_INSTALLMENT_3_PRICE_ID",
  },
}

export function founderStripePriceId(option: FounderPaymentOption): string | null {
  const key = FOUNDER_PAYMENT_OPTIONS[option].stripePriceEnvKey
  const value = process.env[key]?.trim()
  return value || null
}
