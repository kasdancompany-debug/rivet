import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"

export function standardMediaApiPath(mediaId: string): string {
  return `/api/standard-media/${mediaId}`
}

export function parseStandardMediaApiId(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  const match = url.trim().match(/^\/api\/standard-media\/([^/?#]+)/)
  return match?.[1] ?? null
}

function pathLower(media: { storage_path?: string | null } | undefined): string {
  return media?.storage_path?.toLowerCase() ?? ""
}

export function isPdfMedia(media: { storage_path?: string | null; kind?: string } | undefined): boolean {
  if (!media) return false
  return pathLower(media).endsWith(".pdf")
}

export function isAudioMedia(media: { storage_path?: string | null; kind?: string } | undefined): boolean {
  if (!media) return false
  if (media.kind !== "file") return false
  return /\.(mp3|wav|ogg|webm|m4a)(?:$|\?)/.test(pathLower(media))
}

export function isVideoMedia(media: { kind?: string } | undefined): boolean {
  return media?.kind === "video"
}

export function isImageMedia(media: { kind?: string } | undefined): boolean {
  return media?.kind === "image"
}

export function mediaDisplayUrl(media: StandardMediaRowSigned | undefined): string | null {
  if (!media) return null
  return media.signedUrl ?? standardMediaApiPath(media.id)
}

export function mediaLabel(media: StandardMediaRowSigned | undefined): string {
  if (!media) return "Media"
  if (isPdfMedia(media)) return "PDF document"
  if (isAudioMedia(media)) return "Audio recording"
  if (isVideoMedia(media)) return "Video"
  if (isImageMedia(media)) return "Photo"
  return media.caption?.trim() || "File"
}
