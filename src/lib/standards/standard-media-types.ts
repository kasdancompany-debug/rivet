import type { Tables } from "@/types/database"

/** Standard media row plus a time-limited signed URL for the private bucket. */
export type StandardMediaRowSigned = Tables<"standard_media"> & { signedUrl: string | null }
