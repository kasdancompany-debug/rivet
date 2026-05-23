/** Stripe Checkout session.metadata keys for Rivet one-time purchase + webhook. */
export const RIVET_CHECKOUT_METADATA_KEYS = {
  userId: "user_id",
  workspaceId: "workspace_id",
  email: "email",
  product: "rivet_product",
} as const

export const RIVET_CHECKOUT_PRODUCT = "rivet_lifetime_v1" as const

export type RivetCheckoutMetadataInput = {
  userId: string
  workspaceId: string
  email?: string | null
}

export function buildRivetCheckoutMetadata(input: RivetCheckoutMetadataInput): Record<string, string> {
  const metadata: Record<string, string> = {
    [RIVET_CHECKOUT_METADATA_KEYS.userId]: input.userId,
    [RIVET_CHECKOUT_METADATA_KEYS.workspaceId]: input.workspaceId,
    [RIVET_CHECKOUT_METADATA_KEYS.product]: RIVET_CHECKOUT_PRODUCT,
  }
  const email = input.email?.trim()
  if (email) {
    metadata[RIVET_CHECKOUT_METADATA_KEYS.email] = email
  }
  return metadata
}

export function normalizeSiteOrigin(raw: string): string {
  return raw.trim().replace(/\/+$/, "")
}

export function rivetCheckoutSuccessUrl(siteOrigin: string): string {
  return `${normalizeSiteOrigin(siteOrigin)}/dashboard?billing=success`
}

export function rivetCheckoutCancelUrl(siteOrigin: string): string {
  return `${normalizeSiteOrigin(siteOrigin)}/subscribe?billing=canceled`
}

export type ParsedRivetCheckoutMetadata = {
  userId: string | null
  workspaceId: string | null
  email: string | null
  missing: string[]
}

type CheckoutMetadataSource = {
  metadata: Record<string, string> | null | undefined
  client_reference_id?: string | null
  customer_details?: { email?: string | null } | null
  customer_email?: string | null
}

/** Resolves user/workspace from session metadata (supports legacy keys from older sessions). */
export function parseRivetCheckoutMetadata(session: CheckoutMetadataSource): ParsedRivetCheckoutMetadata {
  const meta = session.metadata ?? {}
  const userId =
    meta[RIVET_CHECKOUT_METADATA_KEYS.userId]?.trim() ||
    meta.supabase_user_id?.trim() ||
    session.client_reference_id?.trim() ||
    null
  const workspaceId =
    meta[RIVET_CHECKOUT_METADATA_KEYS.workspaceId]?.trim() || meta.business_id?.trim() || null
  const email =
    meta[RIVET_CHECKOUT_METADATA_KEYS.email]?.trim() ||
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    null

  const missing: string[] = []
  if (!userId) missing.push(RIVET_CHECKOUT_METADATA_KEYS.userId)
  if (!workspaceId) missing.push(RIVET_CHECKOUT_METADATA_KEYS.workspaceId)

  return { userId, workspaceId, email, missing }
}
