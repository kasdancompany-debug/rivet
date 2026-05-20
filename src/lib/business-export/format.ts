export const BUSINESS_EXPORT_FORMAT_ID = "rivet.business_export" as const
/** Earlier exports used this id; importers may accept either. */
export const BUSINESS_EXPORT_LEGACY_FORMAT_ID = "founderos.business_export" as const
/** Pre-rebrand exports. */
export const BUSINESS_EXPORT_LEGACY_HANDOFF_FORMAT_ID = "handoff.business_export" as const

export const BUSINESS_EXPORT_SCHEMA_VERSION = 2 as const

export const BUSINESS_EXPORT_MEDIA_TYPE = "application/vnd.rivet.business+json" as const

/** Suggested download extension for business JSON exports. */
export const BUSINESS_EXPORT_FILE_EXTENSION = ".rivet-export.json" as const
