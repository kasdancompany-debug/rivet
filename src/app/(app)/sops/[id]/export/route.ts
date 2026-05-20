import { fetchBusinessById, fetchSopWithSteps } from "@/lib/db/queries"
import { formatSopCategory } from "@/lib/sops/categories"
import {
  assignedRolesDisplay,
  buildStandardMarkdown,
  standardMarkdownFilename,
  type StandardMarkdownMediaLine,
} from "@/lib/sops/build-standard-markdown"
import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import { signStandardMediaRows } from "@/lib/standards/standard-media-server"
import { canonicalStandardUrl } from "@/lib/site-public-url"
import { createClient } from "@/lib/supabase/server"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const sop = await fetchSopWithSteps(id, supabase)
  if (!sop || sop.status !== "active") {
    return new Response("Not found", { status: 404 })
  }

  const business = await fetchBusinessById(sop.business_id, supabase)
  const businessName = business?.name?.trim() || "Workspace"

  const capture = parseStandardsCapture(sop.standards_capture)
  const assignedRoleLabels = assignedRolesDisplay(capture?.assignedRoles)
  const standardUrl = await canonicalStandardUrl(id)

  const signedMedia = await signStandardMediaRows(sop.standard_media ?? [])
  const mediaLines: StandardMarkdownMediaLine[] = signedMedia.map((row, i) => {
    const label = row.caption?.trim() || `${row.kind} ${i + 1}`
    if (row.kind === "image" && row.signedUrl) {
      return { kind: "image" as const, label, reference: row.signedUrl }
    }
    if (row.kind === "video") {
      return {
        kind: "video" as const,
        label,
        reference: `Video: open ${standardUrl} (attachments may require sign-in).`,
      }
    }
    return {
      kind: "file" as const,
      label,
      reference: row.public_url ?? standardUrl,
    }
  })

  const md = buildStandardMarkdown({
    businessName,
    categoryLabel: formatSopCategory(sop.category),
    standardUrl,
    sop,
    assignedRoleLabels,
    mediaLines: mediaLines.length ? mediaLines : undefined,
  })

  const filename = standardMarkdownFilename(sop.title)

  return new Response(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
