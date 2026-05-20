import type { NavItem } from "@/lib/nav"

/**
 * Pick the single main-nav item that should show as active for `pathname`.
 * Longest matching href wins so `/sops/capture` highlights "Capture a standard", not "How the business runs".
 */
export function resolveActiveNavHref(pathname: string | null, items: readonly NavItem[]): string | null {
  if (!pathname) return null

  const candidates = items.filter((item) => {
    if (pathname === item.href) return true
    if (item.href === "/dashboard") return false
    return pathname.startsWith(`${item.href}/`)
  })

  if (candidates.length === 0) return null
  return candidates.reduce((best, cur) => (cur.href.length > best.href.length ? cur : best)).href
}
