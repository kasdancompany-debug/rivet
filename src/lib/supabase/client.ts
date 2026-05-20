import { createBrowserClient } from "@supabase/ssr"

import { SUPABASE_PLACEHOLDER_ANON_KEY, SUPABASE_PLACEHOLDER_URL } from "@/lib/supabase/placeholders"
import type { Database } from "@/types/database"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? SUPABASE_PLACEHOLDER_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? SUPABASE_PLACEHOLDER_ANON_KEY

  return createBrowserClient<Database>(url, key)
}
