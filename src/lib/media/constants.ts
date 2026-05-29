export {
  STANDARD_MEDIA_BUCKET,
  STANDARD_MEDIA_FILE_MIMES,
  STANDARD_MEDIA_IMAGE_MIMES,
  STANDARD_MEDIA_MAX_FILE_BYTES,
  STANDARD_MEDIA_MAX_IMAGE_BYTES,
  STANDARD_MEDIA_MAX_VIDEO_BYTES,
  STANDARD_MEDIA_SIGNED_URL_TTL_SECONDS,
  STANDARD_MEDIA_VIDEO_MIMES,
} from "@/lib/standards/standard-media-constants"

import {
  STANDARD_MEDIA_FILE_MIMES,
  STANDARD_MEDIA_IMAGE_MIMES,
  STANDARD_MEDIA_VIDEO_MIMES,
} from "@/lib/standards/standard-media-constants"

/** All operational memory uploads (plays, training, Ask Rivet sources). */
export const OPERATIONAL_MEDIA_ACCEPT_ALL = [
  ...STANDARD_MEDIA_IMAGE_MIMES,
  ...STANDARD_MEDIA_VIDEO_MIMES,
  ...STANDARD_MEDIA_FILE_MIMES,
].join(",")

/** Explicit MIME list plus `image/*` for mobile camera and screenshot pickers. */
export const OPERATIONAL_MEDIA_ACCEPT_IMAGES = [
  ...STANDARD_MEDIA_IMAGE_MIMES,
  "image/*",
].join(",")
export const OPERATIONAL_MEDIA_ACCEPT_VIDEOS = STANDARD_MEDIA_VIDEO_MIMES.join(",")
export const OPERATIONAL_MEDIA_ACCEPT_AUDIO = STANDARD_MEDIA_FILE_MIMES.filter((m) =>
  m.startsWith("audio/")
).join(",")
export const OPERATIONAL_MEDIA_ACCEPT_PDF = "application/pdf"
export const OPERATIONAL_MEDIA_ACCEPT_EXAMPLES = [
  ...STANDARD_MEDIA_IMAGE_MIMES,
  ...STANDARD_MEDIA_VIDEO_MIMES,
].join(",")
