import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"

import {
  getDevBypassMockUser,
  isDevAuthBypassEnabled,
  shouldSkipSupabaseNetwork,
} from "@/lib/dev-auth-bypass"
import { createClient } from "@/lib/supabase/server"

/** Current user from Supabase cookies, or the dev mock when network is skipped. */
export async function getServerAuthUser(): Promise<User | null> {
  if (shouldSkipSupabaseNetwork()) {
    return getDevBypassMockUser()
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/** Redirects to login when unauthenticated; in dev bypass returns the mock user. */
export function requireAuthUser(user: User | null, loginNext?: string): User {
  if (user) return user
  if (isDevAuthBypassEnabled()) return getDevBypassMockUser()
  redirect(loginNext ? `/login?next=${encodeURIComponent(loginNext)}` : "/login")
}
