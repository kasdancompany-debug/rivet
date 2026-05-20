"use server"

import { revalidatePath } from "next/cache"

import { STANDARD_MEDIA_BUCKET } from "@/lib/standards/standard-media-constants"
import {
  assertStandardInBusiness,
  prepareSignedUploadPath,
  signStandardMediaRows,
  validateFinalizePath,
} from "@/lib/standards/standard-media-server"
import { validateStandardMediaUpload } from "@/lib/standards/standard-media-validation"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

export type PrepareStandardMediaUploadResult =
  | { ok: true; path: string; signedUrl: string }
  | { ok: false; message: string }

/**
 * Step 1 of 2: returns a short-lived signed upload URL. Client uploads bytes, then calls finalize.
 */
export async function prepareStandardMediaUpload(input: {
  businessId: string
  standardId: string
  fileName: string
  contentType: string
  byteSize: number
}): Promise<PrepareStandardMediaUploadResult> {
  void input.fileName
  const prep = await prepareSignedUploadPath({
    businessId: input.businessId,
    standardId: input.standardId,
    contentType: input.contentType,
    byteSize: input.byteSize,
  })
  if (!prep.ok) {
    return { ok: false, message: prep.message }
  }
  return { ok: true, path: prep.path, signedUrl: prep.signedUrl }
}

export type FinalizeStandardMediaUploadResult =
  | { ok: true; row: Tables<"standard_media"> & { signedUrl: string | null } }
  | { ok: false; message: string }

/**
 * Step 2 of 2: records metadata after the object exists in Storage.
 */
export async function finalizeStandardMediaUpload(input: {
  businessId: string
  standardId: string
  storagePath: string
  contentType: string
  byteSize: number
}): Promise<FinalizeStandardMediaUploadResult> {
  const validated = validateStandardMediaUpload({
    contentType: input.contentType,
    byteSize: input.byteSize,
  })
  if (!validated.ok) {
    return { ok: false, message: validated.message }
  }

  const gate = await assertStandardInBusiness(input.standardId, input.businessId)
  if (!gate.ok) {
    return { ok: false, message: gate.message }
  }

  if (!validateFinalizePath(input.storagePath, input.businessId, input.standardId)) {
    return { ok: false, message: "Invalid storage path for this standard." }
  }

  const supabase = await createClient()

  const { data: inserted, error: insErr } = await supabase
    .from("standard_media")
    .insert({
      business_id: input.businessId,
      standard_id: input.standardId,
      kind: validated.kind,
      storage_path: input.storagePath,
      public_url: null,
    })
    .select("*")
    .single()

  if (insErr || !inserted) {
    const msg =
      insErr?.message && insErr.message.length > 0
        ? insErr.message
        : "Could not save media metadata."
    return { ok: false, message: msg }
  }

  const [signed] = await signStandardMediaRows([inserted])
  revalidatePath(`/sops/${input.standardId}`)
  revalidatePath(`/sops/capture/${input.standardId}`)
  return { ok: true, row: signed }
}

export type DeleteStandardMediaResult = { ok: true } | { ok: false; message: string }

export async function deleteStandardMedia(input: {
  businessId: string
  standardId: string
  mediaId: string
}): Promise<DeleteStandardMediaResult> {
  const supabase = await createClient()

  const { data: row, error: selErr } = await supabase
    .from("standard_media")
    .select("id, business_id, standard_id, storage_path")
    .eq("id", input.mediaId)
    .maybeSingle()

  if (selErr || !row) {
    return { ok: false, message: "Media not found or already removed." }
  }
  if (row.business_id !== input.businessId || row.standard_id !== input.standardId) {
    return { ok: false, message: "You cannot delete this media from this standard." }
  }

  if (row.storage_path) {
    const { error: rmErr } = await supabase.storage
      .from(STANDARD_MEDIA_BUCKET)
      .remove([row.storage_path])
    if (rmErr) {
      return {
        ok: false,
        message:
          rmErr.message?.trim() ||
          "Could not remove the file from storage. Try again in a moment.",
      }
    }
  }

  const { error: delErr } = await supabase.from("standard_media").delete().eq("id", input.mediaId)
  if (delErr) {
    return { ok: false, message: delErr.message?.trim() || "Could not delete media record." }
  }

  revalidatePath(`/sops/${input.standardId}`)
  revalidatePath(`/sops/capture/${input.standardId}`)
  return { ok: true }
}

/** Remove a partially uploaded object when no DB row exists yet (e.g. user cancelled). */
export async function abandonStandardMediaUpload(input: {
  businessId: string
  standardId: string
  storagePath: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await assertStandardInBusiness(input.standardId, input.businessId)
  if (!gate.ok) {
    return { ok: false, message: gate.message }
  }
  if (!validateFinalizePath(input.storagePath, input.businessId, input.standardId)) {
    return { ok: false, message: "Invalid storage path." }
  }

  const supabase = await createClient()
  const { count, error: cntErr } = await supabase
    .from("standard_media")
    .select("id", { count: "exact", head: true })
    .eq("storage_path", input.storagePath)

  if (cntErr) {
    return { ok: false, message: "Could not verify upload state." }
  }
  if ((count ?? 0) > 0) {
    return { ok: true }
  }

  const { error: rmErr } = await supabase.storage
    .from(STANDARD_MEDIA_BUCKET)
    .remove([input.storagePath])

  if (rmErr) {
    return {
      ok: false,
      message: rmErr.message?.trim() || "Could not remove the partial upload.",
    }
  }
  return { ok: true }
}
