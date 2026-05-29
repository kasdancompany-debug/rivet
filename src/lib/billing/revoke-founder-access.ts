import type { TypedSupabaseClient } from "@/types/database"

import { isFounderPurchaseComplete } from "@/lib/billing/founder-purchase-complete"
import { RIVET_BILLING_PLAN } from "@/lib/billing/plans"

/** After a refund, clear grandfathering when no completed founder purchase remains. */
export async function reconcileFounderAccessAfterPurchaseChange(
  admin: TypedSupabaseClient,
  businessId: string
): Promise<void> {
  const { data: paidRows, error } = await admin
    .from("rivet_purchases")
    .select("payment_option, amount, status")
    .eq("business_id", businessId)
    .eq("status", "paid")

  if (error) throw error

  const stillComplete = isFounderPurchaseComplete(
    (paidRows ?? []).map((row) => ({
      payment_option: row.payment_option as string | null,
      amount: row.amount as number,
      status: row.status as string,
    }))
  )

  if (stillComplete) return

  const now = new Date().toISOString()
  await admin
    .from("businesses")
    .update({
      billing_plan: null,
      founder_grandfathered_at: null,
      updated_at: now,
    })
    .eq("id", businessId)
    .eq("billing_plan", RIVET_BILLING_PLAN.founder_lifetime)
}
