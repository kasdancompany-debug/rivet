/** Parse location suffix from profile role, e.g. "Barista · Main St" → "Main St". */
export function parseEmployeeLocation(role: string, businessName: string): string {
  const trimmed = role.trim()
  if (!trimmed) return businessName

  for (const sep of [" · ", " ·", " @ ", "@", " | ", " - "]) {
    const idx = trimmed.lastIndexOf(sep)
    if (idx >= 0) {
      const location = trimmed.slice(idx + sep.length).trim()
      if (location) return location
    }
  }

  return businessName
}

/** Role label without location suffix. */
export function parseEmployeeRoleOnly(role: string): string {
  const trimmed = role.trim()
  if (!trimmed) return ""

  for (const sep of [" · ", " ·", " @ ", "@", " | ", " - "]) {
    const idx = trimmed.lastIndexOf(sep)
    if (idx >= 0) {
      return trimmed.slice(0, idx).trim()
    }
  }

  return trimmed
}
