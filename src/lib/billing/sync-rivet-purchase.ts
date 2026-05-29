import type Stripe from "stripe"

import type { FounderPaymentOption } from "@/lib/billing/founder-offer"
import { isFounderPurchaseComplete } from "@/lib/billing/founder-purchase-complete"
import {
  markBusinessFounderGrandfathered,
  repairFounderGrandfatherIfNeeded,
} from "@/lib/billing/grandfather-founder"
import {
  checkoutProductToBillingPlan,
  defaultFounderCheckoutBillingPlan,
  RIVET_BILLING_PLAN,
} from "@/lib/billing/plans"
import { parseRivetCheckoutMetadata, RIVET_CHECKOUT_METADATA_KEYS } from "@/lib/billing/checkout-metadata"
import type { TypedSupabaseClient } from "@/types/database"

export type RivetPurchaseUpsertResult =
  | {
      ok: true
      status: "paid" | "pending"
      checkoutSessionId: string
      businessId: string
      founderGrandfathered: boolean
    }
  | { ok: false; error: "missing_metadata"; missing: string[]; checkoutSessionId: string }

async function loadPaidPurchasesForBusiness(
  admin: TypedSupabaseClient,
  businessId: string
): Promise<{ payment_option: string | null; amount: number; status: string }[]> {
  const { data, error } = await admin
    .from("rivet_purchases")
    .select("payment_option, amount, status")
    .eq("business_id", businessId)
    .eq("status", "paid")

  if (error) throw error
  return (data ?? []).map((row) => ({
    payment_option: row.payment_option as string | null,
    amount: row.amount as number,
    status: row.status as string,
  }))
}

/** Upsert rivet_purchases from a Stripe Checkout session and grandfather when the offer is fully paid. */
export async function syncRivetPurchaseFromCheckoutSession(
  admin: TypedSupabaseClient,
  session: Stripe.Checkout.Session
): Promise<RivetPurchaseUpsertResult> {
  const parsed = parseRivetCheckoutMetadata(session)
  const { userId, workspaceId, missing } = parsed

  if (missing.length > 0 || !userId || !workspaceId) {
    return {
      ok: false,
      error: "missing_metadata",
      missing,
      checkoutSessionId: session.id,
    }
  }

  const { data: existing } = await admin
    .from("rivet_purchases")
    .select("status, purchased_at")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle()

  const sessionPaid = session.payment_status === "paid"
  const alreadyPaid = existing?.status === "paid"
  const status: "paid" | "pending" = sessionPaid || alreadyPaid ? "paid" : "pending"
  const now = new Date().toISOString()

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null

  const meta = session.metadata ?? {}
  const checkoutProduct = meta[RIVET_CHECKOUT_METADATA_KEYS.product]?.trim() ?? null
  const productPlan =
    meta[RIVET_CHECKOUT_METADATA_KEYS.billingPlan]?.trim() ||
    checkoutProductToBillingPlan(checkoutProduct) ||
    defaultFounderCheckoutBillingPlan()

  const paymentOptionRaw = meta[RIVET_CHECKOUT_METADATA_KEYS.paymentOption]?.trim()
  const paymentOption: FounderPaymentOption | null =
    paymentOptionRaw === "once" || paymentOptionRaw === "installment_3" ? paymentOptionRaw : null

  const purchasedAt =
    status === "paid"
      ? ((existing?.purchased_at as string | null | undefined) ?? now)
      : null

  const row = {
    business_id: workspaceId,
    purchaser_user_id: userId,
    stripe_customer_id: customerId,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    amount: session.amount_total ?? 0,
    currency: (session.currency ?? "cad").toLowerCase(),
    status,
    product_plan: productPlan,
    payment_option: paymentOption,
    purchased_at: purchasedAt,
    updated_at: now,
  }

  const { error } = await admin
    .from("rivet_purchases")
    .upsert(row, { onConflict: "stripe_checkout_session_id" })

  if (error) throw error

  let founderGrandfathered = false
  if (status === "paid" && productPlan === RIVET_BILLING_PLAN.founder_lifetime) {
    const paidRows = await loadPaidPurchasesForBusiness(admin, workspaceId)
    if (isFounderPurchaseComplete(paidRows)) {
      await markBusinessFounderGrandfathered(admin, workspaceId, {
        grandfatheredAt: purchasedAt ?? now,
      })
      await repairFounderGrandfatherIfNeeded(admin, workspaceId)
      founderGrandfathered = true
    }
  }

  return {
    ok: true,
    status,
    checkoutSessionId: session.id,
    businessId: workspaceId,
    founderGrandfathered,
  }
}
