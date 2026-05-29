export function normalizeInviteEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

export function isValidInviteEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
