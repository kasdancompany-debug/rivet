const DEFAULT_ORIGIN = "https://rivet.app"

export function scanReportPublicPath(publicId: string): string {
  return `/report/${publicId}`
}

export function scanReportPublicUrl(publicId: string, origin?: string): string {
  const base = (origin ?? process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_ORIGIN).replace(/\/$/, "")
  return `${base}${scanReportPublicPath(publicId)}`
}
