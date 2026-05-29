import { FOUNDER_LIFETIME_PRICING } from "@/lib/billing/founder-offer"

export type FounderPurchaseRow = {
  payment_option: string | null
  amount: number
  status: string
}

/** Paid rows required for 3× installment founder offer. */
export const FOUNDER_INSTALLMENT_PAYMENT_COUNT = FOUNDER_LIFETIME_PRICING.installmentCount

/** Minimum cumulative cents from installment checkouts (3 × $299). */
export const FOUNDER_INSTALLMENT_TOTAL_CENTS =
  FOUNDER_LIFETIME_PRICING.installmentCount * FOUNDER_LIFETIME_PRICING.installmentAmountCents

/**
 * Founder Lifetime is complete when:
 * - one paid `once` checkout (or legacy row with null payment_option), or
 * - three paid `installment_3` rows, or
 * - installment rows sum to the full installment total.
 */
export function isFounderPurchaseComplete(purchases: FounderPurchaseRow[]): boolean {
  const paid = purchases.filter((p) => p.status === "paid")
  if (paid.length === 0) return false

  const hasOnce = paid.some((p) => p.payment_option === "once" || p.payment_option == null)
  if (hasOnce) return true

  const installments = paid.filter((p) => p.payment_option === "installment_3")
  if (installments.length >= FOUNDER_INSTALLMENT_PAYMENT_COUNT) return true

  const installmentSum = installments.reduce((sum, p) => sum + (p.amount ?? 0), 0)
  return installmentSum >= FOUNDER_INSTALLMENT_TOTAL_CENTS
}
