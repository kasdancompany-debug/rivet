import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { createSupabaseFetch } from "@/lib/supabase/fetch-with-timeout"
import { SUPABASE_PLACEHOLDER_ANON_KEY, SUPABASE_PLACEHOLDER_URL } from "@/lib/supabase/placeholders"
import type { Database } from "@/types/database"

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? SUPABASE_PLACEHOLDER_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? SUPABASE_PLACEHOLDER_ANON_KEY

  const cookieStore = await cookies()

  return createServerClient<Database>(url, key, {
    global: { fetch: createSupabaseFetch() },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component without mutable cookies; middleware keeps session fresh.
        }
      },
    },
  })
}
