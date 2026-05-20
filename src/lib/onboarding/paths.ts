/** Routes that do not require a linked business workspace. */
export function isPathExemptFromBusinessRequirement(pathname: string): boolean {
  if (pathname === "/setup") return true
  if (pathname === "/onboarding") return true
  if (pathname.startsWith("/settings")) return true
  if (pathname === "/subscribe") return true
  if (pathname.startsWith("/auth")) return true
  return false
}

/** Routes that do not require a completed Reality Check (reality_checks row). */
export function isPathExemptFromRealityCheck(pathname: string): boolean {
  if (pathname === "/onboarding") return true
  if (pathname.startsWith("/settings")) return true
  if (pathname === "/subscribe") return true
  if (pathname.startsWith("/auth")) return true
  if (pathname === "/setup") return true
  return false
}

export function isApiOrStaticPath(pathname: string): boolean {
  if (pathname.startsWith("/api")) return true
  if (pathname.startsWith("/_next")) return true
  if (pathname.includes(".")) return true
  return false
}
