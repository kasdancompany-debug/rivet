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
