import { NextResponse } from "next/server"

import {
  STANDARD_MEDIA_BUCKET,
  STANDARD_MEDIA_SIGNED_URL_TTL_SECONDS,
} from "@/lib/standards/standard-media-constants"
import { createClient } from "@/lib/supabase/server"

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Authenticated redirect to a short-lived signed URL for private bucket media.
 * Stable URL for embedding in standard steps (`/api/standard-media/:id`).
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Sign in to view this media." }, { status: 401 })
  }

  const { data: row, error } = await supabase
    .from("standard_media")
    .select("id, storage_path")
    .eq("id", id)
    .maybeSingle()

  if (error || !row?.storage_path) {
    return NextResponse.json({ error: "Media not found." }, { status: 404 })
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(STANDARD_MEDIA_BUCKET)
    .createSignedUrl(row.storage_path, STANDARD_MEDIA_SIGNED_URL_TTL_SECONDS)

  if (signErr || !signed?.signedUrl) {
    return NextResponse.json(
      { error: "Could not generate a temporary link for this file." },
      { status: 502 }
    )
  }

  return NextResponse.redirect(signed.signedUrl, { status: 302 })
}
