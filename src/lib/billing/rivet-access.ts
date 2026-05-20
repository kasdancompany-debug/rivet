import type { TypedSupabaseClient } from "@/types/database"

/** True when this business has a completed one-time Rivet purchase. */
export async function businessHasPaidRivetPurchase(
  supabase: TypedSupabaseClient,
  businessId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("rivet_purchases")
    .select("id")
    .eq("business_id", businessId)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle()

  if (error) return false
  return Boolean(data?.id)
}
