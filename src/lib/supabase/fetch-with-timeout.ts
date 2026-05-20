import { SUPABASE_PLACEHOLDER_URL } from "@/lib/supabase/placeholders"

/** Fail fast when Supabase is slow or unreachable (was 12s — felt hung in the browser). */
const DEFAULT_MS = 6_000

export const MIDDLEWARE_SUPABASE_FETCH_MS = 4_000

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.href
  return input.url
}

/**
 * Fetch wrapper for Supabase clients so auth/REST calls fail fast when the host
 * is unreachable instead of hanging the Next.js request indefinitely.
 */
export function createSupabaseFetch(timeoutMs = DEFAULT_MS): typeof fetch {
  return (input, init) => {
    if (requestUrl(input).includes(SUPABASE_PLACEHOLDER_URL)) {
      return Promise.resolve(
        new Response(JSON.stringify({ message: "Supabase is not configured" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    }

    const timeout = AbortSignal.timeout(timeoutMs)
    const signal =
      init?.signal != null
        ? AbortSignal.any([init.signal, timeout])
        : timeout
    return fetch(input, { ...init, signal })
  }
}
