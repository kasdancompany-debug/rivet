import { SUPABASE_PLACEHOLDER_ANON_KEY, SUPABASE_PLACEHOLDER_URL } from "@/lib/supabase/placeholders"

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) return false
  if (url === SUPABASE_PLACEHOLDER_URL) return false
  if (key === SUPABASE_PLACEHOLDER_ANON_KEY) return false
  return true
}

/** Browser-safe check (public env vars only). */
export function isSupabaseConfiguredClient(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) return false
  if (url.includes("placeholder.supabase.co")) return false
  return true
}

/** User-facing hint when Supabase env vars are missing (local vs deployed). */
export function supabaseNotConfiguredMessage(forBrowser = false): string {
  const onDeployedHost =
    forBrowser &&
    typeof window !== "undefined" &&
    !/localhost|127\.0\.0\.1/.test(window.location.hostname)
  if (onDeployedHost) {
    return "Supabase is not configured on this server. In Vercel → Project → Settings → Environment Variables, add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (Production), then redeploy."
  }
  return "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (Supabase → Settings → API), then restart npm run dev."
}
