/** Stored in `execution_record_items.photo_url` until real uploads ship. */
export const PHOTO_PLACEHOLDER_VALUE = "placeholder:pending"

export function isPhotoPending(url: string | null): boolean {
  return url === PHOTO_PLACEHOLDER_VALUE
}

export function hasPhotoConfirmed(url: string | null): boolean {
  return Boolean(url && !isPhotoPending(url))
}
