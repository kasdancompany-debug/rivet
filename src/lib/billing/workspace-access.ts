import type { TypedSupabaseClient } from "@/types/database"

import { subscriptionAllowsAppAccess } from "@/lib/billing/config"
import { subscriptionStatusAffectsAccess } from "@/lib/billing/billing-guards"
import { isFounderPurchaseComplete } from "@/lib/billing/founder-purchase-complete"
import {
  isFounderGrandfathered,
  isFounderLifetimeBillingPlan,
  RIVET_BILLING_PLAN,
  type RivetBillingPlanId,
} from "@/lib/billing/plans"

export type WorkspaceBillingAccess = {
  hasAppAccess: boolean
  billingPlan: RivetBillingPlanId | null
  founderGrandfathered: boolean
  /** Founder offer fully paid (once or all installments). */
  hasCompletedFounderPurchase: boolean
  subscriptionStatus: string | null
  accessSource: "founder_lifetime" | "subscription" | "none"
}

type BusinessBillingRow = {
  billing_plan: string | null
  founder_grandfathered_at: string | null
}

export function resolveWorkspaceBillingAccess(input: {
  business: BusinessBillingRow | null
  hasCompletedFounderPurchase: boolean
  subscriptionStatus?: string | null
}): WorkspaceBillingAccess {
  const billingPlan = (input.business?.billing_plan as RivetBillingPlanId | null) ?? null
  const founderGrandfathered =
    input.hasCompletedFounderPurchase ||
    isFounderGrandfathered({
      billingPlan,
      founderGrandfatheredAt: input.business?.founder_grandfathered_at ?? null,
    })

  const subscriptionOk =
    subscriptionStatusAffectsAccess({ founderGrandfathered, subscriptionStatus: input.subscriptionStatus }) &&
    subscriptionAllowsAppAccess(input.subscriptionStatus)
  const hasAppAccess = founderGrandfathered || subscriptionOk

  let accessSource: WorkspaceBillingAccess["accessSource"] = "none"
  if (founderGrandfathered) accessSource = "founder_lifetime"
  else if (subscriptionOk) accessSource = "subscription"

  const resolvedPlan: RivetBillingPlanId | null = founderGrandfathered
    ? RIVET_BILLING_PLAN.founder_lifetime
    : isFounderLifetimeBillingPlan(billingPlan)
      ? RIVET_BILLING_PLAN.founder_lifetime
      : billingPlan

  return {
    hasAppAccess,
    billingPlan: resolvedPlan,
    founderGrandfathered,
    hasCompletedFounderPurchase: input.hasCompletedFounderPurchase,
    subscriptionStatus: input.subscriptionStatus ?? null,
    accessSource,
  }
}

export async function getWorkspaceBillingAccess(
  supabase: TypedSupabaseClient,
  businessId: string,
  ownerUserId?: string | null
): Promise<WorkspaceBillingAccess> {
  const [businessRes, purchaseRes, subscriptionRes] = await Promise.all([
    supabase
      .from("businesses")
      .select("billing_plan, founder_grandfathered_at")
      .eq("id", businessId)
      .maybeSingle(),
    supabase
      .from("rivet_purchases")
      .select("payment_option, amount, status")
      .eq("business_id", businessId)
      .eq("status", "paid"),
    ownerUserId
      ? supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", ownerUserId)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  const business = businessRes.data as BusinessBillingRow | null
  const paidRows = (purchaseRes.data ?? []).map((row) => ({
    payment_option: row.payment_option as string | null,
    amount: row.amount as number,
    status: row.status as string,
  }))
  const hasCompletedFounderPurchase = isFounderPurchaseComplete(paidRows)

  return resolveWorkspaceBillingAccess({
    business,
    hasCompletedFounderPurchase,
    subscriptionStatus: (subscriptionRes.data?.status as string | undefined) ?? null,
  })
}

/** Gate used by middleware and server routes — founders always pass when paid or grandfathered. */
export async function workspaceHasRivetAppAccess(
  supabase: TypedSupabaseClient,
  businessId: string,
  ownerUserId?: string | null
): Promise<boolean> {
  const access = await getWorkspaceBillingAccess(supabase, businessId, ownerUserId)
  return access.hasAppAccess
}
