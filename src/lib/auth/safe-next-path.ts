/**
 * Prevents open redirects via `next` / `returnTo` query params (e.g. `//evil.com`).
 * Only same-origin relative paths starting with a single `/` are allowed.
 */
export function getSafeInternalNextPath(
  raw: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (raw == null) return fallback
  const s = raw.trim()
  if (s === "") return fallback
  if (!s.startsWith("/") || s.startsWith("//")) return fallback
  if (/\n|\r/.test(s)) return fallback
  const pathOnly = s.split("?")[0]?.split("#")[0] ?? s
  if (pathOnly.includes("://") || pathOnly.includes("\\")) return fallback
  if (!pathOnly.startsWith("/") || pathOnly.startsWith("//")) return fallback
  return s
}
