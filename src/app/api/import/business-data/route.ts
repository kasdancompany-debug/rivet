import {
  BUSINESS_EXPORT_FORMAT_ID,
  BUSINESS_EXPORT_LEGACY_FORMAT_ID,
  BUSINESS_EXPORT_LEGACY_HANDOFF_FORMAT_ID,
} from "@/lib/business-export/format"

export const dynamic = "force-dynamic"

/**
 * Placeholder for transactional import (id remap, FK rewrite, conflict policy).
 * @see docs/architecture/desktop-local-first.md
 */
export async function POST() {
  return Response.json(
    {
      error: "not_implemented",
      message:
        "Import is not available yet. Use the export file as an offline backup until desktop import ships.",
      future: {
        method: "POST",
        contentType: "application/json",
        expectedFormats: [
          BUSINESS_EXPORT_FORMAT_ID,
          BUSINESS_EXPORT_LEGACY_FORMAT_ID,
          BUSINESS_EXPORT_LEGACY_HANDOFF_FORMAT_ID,
        ],
        notes: [
          "Validate schemaVersion before applying.",
          "Remap UUIDs when creating a new business; preserve idMap for FK columns.",
          "Apply in dependency order (business → profiles → sops → steps → …).",
        ],
      },
    },
    { status: 501 }
  )
}
