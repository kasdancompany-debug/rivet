import { headers } from "next/headers"

/**
 * Public site origin for canonical links and QR targets.
 * Prefer `NEXT_PUBLIC_SITE_URL`; otherwise derive from request headers.
 */
export async function getPublicOriginForRequest(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (env) {
    return env.replace(/\/$/, "")
  }
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")
  return `${proto}://${host}`
}

export async function canonicalStandardUrl(standardId: string): Promise<string> {
  const origin = await getPublicOriginForRequest()
  return `${origin}/sops/${standardId}`
}
