import type { TypedSupabaseClient } from "@/types/database"

import { shouldEnforceBillingGate } from "@/lib/billing/billing-readiness"
import { isFounderPurchaseComplete } from "@/lib/billing/founder-purchase-complete"
import { workspaceHasRivetAppAccess } from "@/lib/billing/workspace-access"

/** True when this workspace completed the founder offer (once or all installments). */
export async function businessHasCompletedFounderPurchase(
  supabase: TypedSupabaseClient,
  businessId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("rivet_purchases")
    .select("payment_option, amount, status")
    .eq("business_id", businessId)
    .eq("status", "paid")

  if (error || !data?.length) return false
  return isFounderPurchaseComplete(
    data.map((row) => ({
      payment_option: row.payment_option as string | null,
      amount: row.amount as number,
      status: row.status as string,
    }))
  )
}

/** @deprecated Use businessHasCompletedFounderPurchase — any paid row is not sufficient for installments. */
export async function businessHasPaidRivetPurchase(
  supabase: TypedSupabaseClient,
  businessId: string
): Promise<boolean> {
  return businessHasCompletedFounderPurchase(supabase, businessId)
}

/** Founder-grandfathered or active subscription — used for app gates. */
export async function businessHasRivetAppAccess(
  supabase: TypedSupabaseClient,
  businessId: string,
  ownerUserId?: string | null
): Promise<boolean> {
  return workspaceHasRivetAppAccess(supabase, businessId, ownerUserId)
}

/** Billing gate helper — open access and DB errors fail open so signup is not blocked. */
export async function safeBusinessHasRivetAppAccess(
  supabase: TypedSupabaseClient,
  businessId: string,
  ownerUserId?: string | null
): Promise<boolean> {
  if (!shouldEnforceBillingGate()) return true
  try {
    return await businessHasRivetAppAccess(supabase, businessId, ownerUserId)
  } catch (error) {
    console.error("[rivet] billing access check failed", error)
    return true
  }
}
