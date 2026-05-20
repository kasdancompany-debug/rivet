import {
  STANDARD_MEDIA_IMAGE_MIMES,
  STANDARD_MEDIA_MAX_IMAGE_BYTES,
  STANDARD_MEDIA_MAX_VIDEO_BYTES,
  STANDARD_MEDIA_VIDEO_MIMES,
} from "@/lib/standards/standard-media-constants"

export type StandardMediaKind = "image" | "video"

export type StandardMediaValidationResult =
  | { ok: true; kind: StandardMediaKind }
  | { ok: false; message: string }

function normalizeMime(mime: string): string {
  return mime.trim().toLowerCase().split(";")[0] ?? ""
}

function isImageMime(mime: string): boolean {
  return (STANDARD_MEDIA_IMAGE_MIMES as readonly string[]).includes(mime)
}

function isVideoMime(mime: string): boolean {
  return (STANDARD_MEDIA_VIDEO_MIMES as readonly string[]).includes(mime)
}

/**
 * Validates client- or server-side upload metadata.
 * Prefer `file.type` / `file.size` on the client; mirror checks on the server.
 */
export function validateStandardMediaUpload(input: {
  contentType: string
  byteSize: number
}): StandardMediaValidationResult {
  const mime = normalizeMime(input.contentType)
  if (!mime) {
    return {
      ok: false,
      message:
        "We could not read this file’s type. Use JPG, PNG, or WebP for images, or MP4, MOV, or WebM for video.",
    }
  }

  if (isImageMime(mime)) {
    if (input.byteSize > STANDARD_MEDIA_MAX_IMAGE_BYTES) {
      return {
        ok: false,
        message: `Images must be ${Math.round(STANDARD_MEDIA_MAX_IMAGE_BYTES / (1024 * 1024))} MB or smaller.`,
      }
    }
    return { ok: true, kind: "image" }
  }

  if (isVideoMime(mime)) {
    if (input.byteSize > STANDARD_MEDIA_MAX_VIDEO_BYTES) {
      return {
        ok: false,
        message: `Videos must be ${Math.round(STANDARD_MEDIA_MAX_VIDEO_BYTES / (1024 * 1024))} MB or smaller.`,
      }
    }
    return { ok: true, kind: "video" }
  }

  return {
    ok: false,
    message:
      "Unsupported file type. Allowed: JPG, PNG, WebP, MP4, MOV, WebM.",
  }
}

export function extensionForStandardMediaKind(
  kind: StandardMediaKind,
  contentType: string
): string {
  const mime = normalizeMime(contentType)
  if (kind === "image") {
    if (mime === "image/png") return ".png"
    if (mime === "image/webp") return ".webp"
    return ".jpg"
  }
  if (mime === "video/quicktime") return ".mov"
  if (mime === "video/webm") return ".webm"
  return ".mp4"
}
