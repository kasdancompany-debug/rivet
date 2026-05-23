/**
 * Internal launch QA routes — never expose secrets on these pages.
 * Production: comma-separated `RIVET_INTERNAL_ADMIN_EMAILS` only.
 * Development: any signed-in user (or dev bypass session).
 */

function parseAdminEmails(): string[] {
  const raw = process.env.RIVET_INTERNAL_ADMIN_EMAILS?.trim()
  if (!raw) return []
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

export function canAccessInternalBillingDiagnostics(
  email: string | null | undefined
): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true
  }
  const admins = parseAdminEmails()
  if (admins.length === 0) return false
  if (!email?.trim()) return false
  return admins.includes(email.trim().toLowerCase())
}

export function internalDiagnosticsAccessHint(): string {
  if (process.env.NODE_ENV !== "production") {
    return "Available in development for any signed-in session."
  }
  const n = parseAdminEmails().length
  if (n === 0) {
    return "Production access requires RIVET_INTERNAL_ADMIN_EMAILS on the server."
  }
  return `Production access limited to ${n} configured admin email(s).`
}
