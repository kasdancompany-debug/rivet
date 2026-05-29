import {
  STANDARD_MEDIA_FILE_MIMES,
  STANDARD_MEDIA_IMAGE_MIMES,
  STANDARD_MEDIA_MAX_FILE_BYTES,
  STANDARD_MEDIA_MAX_IMAGE_BYTES,
  STANDARD_MEDIA_MAX_VIDEO_BYTES,
  STANDARD_MEDIA_VIDEO_MIMES,
} from "@/lib/standards/standard-media-constants"

/** Client validation kind — maps to `standard_media.kind` (image | video | file). */
export type StandardMediaKind = "image" | "video" | "file"

export type StandardMediaValidationResult =
  | { ok: true; kind: StandardMediaKind; storageKind: "image" | "video" | "file" }
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

function isFileMime(mime: string): boolean {
  return (STANDARD_MEDIA_FILE_MIMES as readonly string[]).includes(mime)
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
        "We could not read this file’s type. Use photos, video, PDF, or audio.",
    }
  }

  if (isImageMime(mime)) {
    if (input.byteSize > STANDARD_MEDIA_MAX_IMAGE_BYTES) {
      return {
        ok: false,
        message: `Images must be ${Math.round(STANDARD_MEDIA_MAX_IMAGE_BYTES / (1024 * 1024))} MB or smaller.`,
      }
    }
    return { ok: true, kind: "image", storageKind: "image" }
  }

  if (isVideoMime(mime)) {
    if (input.byteSize > STANDARD_MEDIA_MAX_VIDEO_BYTES) {
      return {
        ok: false,
        message: `Videos must be ${Math.round(STANDARD_MEDIA_MAX_VIDEO_BYTES / (1024 * 1024))} MB or smaller.`,
      }
    }
    return { ok: true, kind: "video", storageKind: "video" }
  }

  if (isFileMime(mime)) {
    if (input.byteSize > STANDARD_MEDIA_MAX_FILE_BYTES) {
      return {
        ok: false,
        message: `Documents and audio must be ${Math.round(STANDARD_MEDIA_MAX_FILE_BYTES / (1024 * 1024))} MB or smaller.`,
      }
    }
    return { ok: true, kind: "file", storageKind: "file" }
  }

  return {
    ok: false,
    message:
      "Unsupported file type. Allowed: photos, screenshots (PNG/JPG/WebP/GIF), MP4, MOV, WebM, PDF, and audio recordings.",
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
    if (mime === "image/gif") return ".gif"
    return ".jpg"
  }
  if (kind === "file") {
    if (mime === "application/pdf") return ".pdf"
    if (mime === "audio/mpeg") return ".mp3"
    if (mime === "audio/wav" || mime === "audio/x-wav") return ".wav"
    if (mime === "audio/ogg") return ".ogg"
    if (mime === "audio/webm") return ".webm"
    if (mime === "audio/mp4") return ".m4a"
    return ".bin"
  }
  if (mime === "video/quicktime") return ".mov"
  if (mime === "video/webm") return ".webm"
  return ".mp4"
}
