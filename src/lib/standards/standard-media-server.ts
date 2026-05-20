import "server-only"

import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import {
  STANDARD_MEDIA_BUCKET,
  STANDARD_MEDIA_SIGNED_URL_TTL_SECONDS,
} from "@/lib/standards/standard-media-constants"
import {
  extensionForStandardMediaKind,
  validateStandardMediaUpload,
} from "@/lib/standards/standard-media-validation"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

export type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"

export async function signStandardMediaRows(
  rows: Tables<"standard_media">[],
  expiresIn: number = STANDARD_MEDIA_SIGNED_URL_TTL_SECONDS
): Promise<StandardMediaRowSigned[]> {
  const supabase = await createClient()
  const out: StandardMediaRowSigned[] = []

  for (const row of rows) {
    if (!row.storage_path) {
      out.push({ ...row, signedUrl: row.public_url })
      continue
    }
    const { data, error } = await supabase.storage
      .from(STANDARD_MEDIA_BUCKET)
      .createSignedUrl(row.storage_path, expiresIn)

    if (error || !data?.signedUrl) {
      out.push({ ...row, signedUrl: null })
    } else {
      out.push({ ...row, signedUrl: data.signedUrl })
    }
  }

  return out
}

/** Build storage object path (no leading slash). */
export function buildStandardMediaObjectPath(params: {
  businessId: string
  standardId: string
  objectId: string
  extension: string
}): string {
  const ext = params.extension.startsWith(".") ? params.extension : `.${params.extension}`
  return `${params.businessId}/${params.standardId}/${params.objectId}${ext}`
}

export async function assertStandardInBusiness(
  standardId: string,
  businessId: string
): Promise<{ ok: true; row: Pick<Tables<"standards">, "id" | "business_id"> } | { ok: false; message: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("standards")
    .select("id, business_id")
    .eq("id", standardId)
    .maybeSingle()

  if (error || !data) {
    return { ok: false, message: "Standard not found or you do not have access." }
  }
  if (data.business_id !== businessId) {
    return { ok: false, message: "Standard does not belong to this workspace." }
  }
  return { ok: true, row: data }
}

export function parseStandardMediaStoragePath(path: string): {
  businessId: string
  standardId: string
} | null {
  const parts = path.split("/").filter(Boolean)
  if (parts.length < 3) return null
  const businessId = parts[0]!
  const standardId = parts[1]!
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRe.test(businessId) || !uuidRe.test(standardId)) return null
  return { businessId, standardId }
}

export function validateFinalizePath(
  path: string,
  expectedBusinessId: string,
  expectedStandardId: string
): boolean {
  const parsed = parseStandardMediaStoragePath(path)
  if (!parsed) return false
  return (
    parsed.businessId === expectedBusinessId && parsed.standardId === expectedStandardId
  )
}

export async function prepareSignedUploadPath(params: {
  businessId: string
  standardId: string
  contentType: string
  byteSize: number
}): Promise<
  | { ok: true; path: string; signedUrl: string; token: string }
  | { ok: false; message: string }
> {
  const validated = validateStandardMediaUpload({
    contentType: params.contentType,
    byteSize: params.byteSize,
  })
  if (!validated.ok) {
    return { ok: false, message: validated.message }
  }

  const gate = await assertStandardInBusiness(params.standardId, params.businessId)
  if (!gate.ok) {
    return { ok: false, message: gate.message }
  }

  const supabase = await createClient()
  const objectId = crypto.randomUUID()
  const ext = extensionForStandardMediaKind(validated.kind, params.contentType)
  const path = buildStandardMediaObjectPath({
    businessId: params.businessId,
    standardId: params.standardId,
    objectId,
    extension: ext,
  })

  const { data, error } = await supabase.storage
    .from(STANDARD_MEDIA_BUCKET)
    .createSignedUploadUrl(path, { upsert: false })

  if (error || !data?.signedUrl || !data.token) {
    const msg =
      error?.message && error.message.length > 0
        ? error.message
        : "Could not start upload. Save your draft and try again."
    return { ok: false, message: msg }
  }

  return { ok: true, path: data.path, signedUrl: data.signedUrl, token: data.token }
}
