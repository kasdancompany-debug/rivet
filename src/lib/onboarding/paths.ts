/** Internal launch QA routes (e.g. /internal/billing-check). */
export function isInternalDiagnosticsPath(pathname: string): boolean {
  return pathname.startsWith("/internal/")
}

/** Routes that do not require a linked business workspace. */
export function isPathExemptFromBusinessRequirement(pathname: string): boolean {
  if (isInternalDiagnosticsPath(pathname)) return true
  if (pathname === "/setup") return true
  if (pathname === "/onboarding") return true
  if (pathname.startsWith("/settings")) return true
  if (pathname === "/subscribe") return true
  if (pathname.startsWith("/auth")) return true
  if (pathname.startsWith("/learn")) return true
  if (pathname.startsWith("/join")) return true
  return false
}

/** Routes that do not require a completed Reality Check (reality_checks row). */
export function isPathExemptFromRealityCheck(pathname: string): boolean {
  if (isInternalDiagnosticsPath(pathname)) return true
  if (pathname === "/onboarding") return true
  if (pathname.startsWith("/settings")) return true
  if (pathname === "/subscribe") return true
  if (pathname.startsWith("/auth")) return true
  if (pathname === "/setup") return true
  if (pathname.startsWith("/learn")) return true
  if (pathname.startsWith("/join")) return true
  return false
}

/** Routes reachable before industry template foundation is installed. */
export function isPathExemptFromTemplateInstall(pathname: string): boolean {
  return isPathExemptFromRealityCheck(pathname)
}

/** Routes that skip workspace role checks (portal, setup, billing). */
export function isPathExemptFromRoleCheck(pathname: string): boolean {
  if (isInternalDiagnosticsPath(pathname)) return true
  if (isPathExemptFromBusinessRequirement(pathname)) return true
  if (pathname.startsWith("/api")) return true
  if (pathname.startsWith("/auth")) return true
  return false
}

export function isApiOrStaticPath(pathname: string): boolean {
  if (pathname.startsWith("/api")) return true
  if (pathname.startsWith("/_next")) return true
  if (pathname.includes(".")) return true
  return false
}
