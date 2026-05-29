import type { TypedSupabaseClient } from "@/types/database"

import { RIVET_BILLING_PLAN } from "@/lib/billing/plans"

/** Persist permanent founder access on the workspace after a paid founder checkout. */
export async function markBusinessFounderGrandfathered(
  admin: TypedSupabaseClient,
  businessId: string,
  options?: { grandfatheredAt?: string }
): Promise<void> {
  const at = options?.grandfatheredAt ?? new Date().toISOString()
  const { error } = await admin
    .from("businesses")
    .update({
      billing_plan: RIVET_BILLING_PLAN.founder_lifetime,
      founder_grandfathered_at: at,
      updated_at: at,
    })
    .eq("id", businessId)

  if (error) throw error
}

/** Re-apply founder plan if a row was grandfathered but billing_plan was overwritten (safety net). */
export async function repairFounderGrandfatherIfNeeded(
  admin: TypedSupabaseClient,
  businessId: string
): Promise<void> {
  const { data, error } = await admin
    .from("businesses")
    .select("billing_plan, founder_grandfathered_at")
    .eq("id", businessId)
    .maybeSingle()

  if (error || !data?.founder_grandfathered_at) return

  if (data.billing_plan === RIVET_BILLING_PLAN.founder_lifetime) return

  await markBusinessFounderGrandfathered(admin, businessId, {
    grandfatheredAt: data.founder_grandfathered_at as string,
  })
}
