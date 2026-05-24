import { createAdminClient } from "@/lib/supabase/admin"
import type { TypedSupabaseClient } from "@/types/database"

/** Service-role client when configured; null in dev or when SUPABASE_SERVICE_ROLE_KEY is unset. */
export function tryCreateAdminClient(): TypedSupabaseClient | null {
  try {
    return createAdminClient()
  } catch {
    return null
  }
}
