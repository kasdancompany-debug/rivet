/** Supabase Storage bucket id (private; use signed URLs or /api/standard-media/[id]). */
export const STANDARD_MEDIA_BUCKET = "standard-media" as const

/** Max upload size per file (bytes). */
export const STANDARD_MEDIA_MAX_IMAGE_BYTES = 15 * 1024 * 1024
export const STANDARD_MEDIA_MAX_VIDEO_BYTES = 200 * 1024 * 1024
export const STANDARD_MEDIA_MAX_FILE_BYTES = 25 * 1024 * 1024

export const STANDARD_MEDIA_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const

export const STANDARD_MEDIA_VIDEO_MIMES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const

export const STANDARD_MEDIA_FILE_MIMES = [
  "application/pdf",
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
] as const

export type StandardMediaImageMime = (typeof STANDARD_MEDIA_IMAGE_MIMES)[number]
export type StandardMediaVideoMime = (typeof STANDARD_MEDIA_VIDEO_MIMES)[number]

export const STANDARD_MEDIA_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const
export const STANDARD_MEDIA_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm"] as const

export const STANDARD_MEDIA_SIGNED_URL_TTL_SECONDS = 3600
