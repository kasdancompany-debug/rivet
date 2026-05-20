import { buildBusinessDataExport, BUSINESS_EXPORT_MEDIA_TYPE } from "@/lib/business-export"
import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function slugForFilename(name: string): string {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return s.slice(0, 48) || "business"
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 })
  }

  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) {
    return Response.json(
      { error: "no_workspace", message: "Link or create a business in Settings before exporting." },
      { status: 403 }
    )
  }

  try {
    const payload = await buildBusinessDataExport(supabase, business.id)
    const body = JSON.stringify(payload, null, 2)
    const date = payload.exportedAt.slice(0, 10)
    const slug = slugForFilename(business.name)
    const filename = `rivet-export-${slug}-${date}.json`

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": `${BUSINESS_EXPORT_MEDIA_TYPE}; charset=utf-8`,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Export failed"
    return Response.json({ error: "export_failed", message }, { status: 500 })
  }
}
