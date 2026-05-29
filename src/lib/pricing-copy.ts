/**
 * Rivet pricing — marketing copy for landing, subscribe, scan, and metadata.
 * Commercial terms and grandfather contract: `@/lib/billing/founder-offer`.
 * Plan IDs and Stripe products: `@/lib/billing/plans`.
 */

import {
  FOUNDER_GRANDFATHER_CONTRACT,
  FOUNDER_LIFETIME_PRICING,
  FOUNDER_LIFETIME_PROMISES,
} from "@/lib/billing/founder-offer"

export { FOUNDER_GRANDFATHER_CONTRACT, FOUNDER_LIFETIME_PRICING, FOUNDER_LIFETIME_PROMISES }

export const RIVET_PRICING = {
  productName: "Founder Lifetime Access",
  limitedFounderRelease: "Limited founder release",
  priceOnce: FOUNDER_LIFETIME_PRICING.onceDisplay,
  priceInstallment: FOUNDER_LIFETIME_PRICING.installmentDisplay,
  priceDisplay: FOUNDER_LIFETIME_PRICING.priceDisplay,
  priceInstallmentDisplay: FOUNDER_LIFETIME_PRICING.installmentTotalDisplay,
  currencyOnce: "CAD · once",
  currencyInstallment: "CAD · 3 payments",
  positioningLines: [
    FOUNDER_LIFETIME_PROMISES[1],
    "Build your operating memory once.",
    "Keep Rivet Core on your workspace permanently.",
  ] as const,
  positioningShort: `${FOUNDER_LIFETIME_PROMISES[1]} ${FOUNDER_LIFETIME_PROMISES[0]}—permanently on your workspace.`,
  cta: "Get Founder Lifetime Access",
  checkoutCta: "Continue to Stripe Checkout",
  included: [...FOUNDER_LIFETIME_PROMISES],
  metaLine: `Founder Lifetime Access — ${FOUNDER_LIFETIME_PRICING.onceDisplay} ${FOUNDER_LIFETIME_PRICING.installmentDisplay}. ${FOUNDER_LIFETIME_PROMISES.join(". ")}.`,
  subscribeTitle: "Founder Lifetime Access",
  subscribeLead: `Limited founder release — ${FOUNDER_LIFETIME_PRICING.onceDisplay}, ${FOUNDER_LIFETIME_PRICING.installmentDisplay}. Your workspace unlocks as soon as Stripe confirms.`,
  subscribeCardNote:
    "Founder workspaces are permanently grandfathered: Rivet Core, future core updates, and no recurring subscription—even when paid subscription tiers launch later.",
  founderGrandfatherNote:
    "Founder Lifetime Access is permanently grandfathered on this workspace. Future subscription tiers will not replace, downgrade, or revoke your access.",
  paymentOnceLabel: FOUNDER_LIFETIME_PRICING.onceDisplay,
  paymentInstallmentLabel: FOUNDER_LIFETIME_PRICING.installmentTotalDisplay,
} as const
