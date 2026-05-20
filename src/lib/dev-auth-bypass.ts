import type { User } from "@supabase/supabase-js"

import { isSupabaseConfigured } from "@/lib/supabase/config"

/**
 * When `DEV_BYPASS_AUTH` is true, local dev skips real sign-in and uses a mock
 * session for the app shell. Never enable in production.
 */
export function isDevAuthBypassEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false
  const v = process.env.DEV_BYPASS_AUTH
  return v === "1" || v?.toLowerCase() === "true"
}

/** Dev bypass without real Supabase keys — skip network calls (no placeholder timeouts). */
export function shouldSkipSupabaseNetwork(): boolean {
  return isDevAuthBypassEnabled() && !isSupabaseConfigured()
}

/** Where marketing / CTAs should send users who want to open the app. */
export function getAppSignInHref(next = "/dashboard"): string {
  if (isDevAuthBypassEnabled()) {
    return next
  }
  if (next === "/dashboard") return "/login"
  return `/login?next=${encodeURIComponent(next)}`
}

/** Stable fake id; only used when no Supabase session exists in bypass mode. */
const MOCK_USER_ID = "00000000-0000-4000-8000-000000000001"

export function getDevBypassMockUser(): User {
  const now = new Date().toISOString()
  return {
    id: MOCK_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "you@dev.local",
    email_confirmed_at: now,
    phone: "",
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: {},
    user_metadata: { full_name: "Dev (bypass)" },
    identities: [],
    factors: [],
    created_at: now,
    updated_at: now,
    is_anonymous: false,
  } as User
}
