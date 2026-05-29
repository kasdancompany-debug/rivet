import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { CaptureStandardForm } from "@/components/sops/capture-standard-form"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { fetchBusinessForCurrentUser, fetchSopWithSteps } from "@/lib/db/queries"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { signStandardMediaRows } from "@/lib/standards/standard-media-server"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const sop = await fetchSopWithSteps(id, supabase)
  return { title: sop ? `Capture · ${sop.title}` : "Capture a play" }
}

export default async function ResumeCapturePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const [business, sop] = await Promise.all([
    fetchBusinessForCurrentUser(supabase),
    fetchSopWithSteps(id, supabase),
  ])

  if (!business) {
    const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(false)]
    return (
      <DashboardRouteShell routePath={`/sops/capture/${id}`} fetchLines={fetchLines}>
        <div className="space-y-4">
          <BusinessLinkRequiredPanel
            title="Workspace required"
            description="Link a business in Settings before capturing plays."
            className="border-border/60 bg-card/70 shadow-sm"
          />
          <Button variant="outline" nativeButton={false} render={<Link href="/sops" />}>
            Back to plays
          </Button>
        </div>
      </DashboardRouteShell>
    )
  }

  if (!sop || sop.business_id !== business.id) {
    notFound()
  }

  if (sop.status !== "draft") {
    redirect(`/sops/${sop.id}`)
  }

  const signedMedia = await signStandardMediaRows(sop.standard_media ?? [])

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    { label: "Resume capture", status: "ok", detail: `Draft · ${sop.title}` },
  ]

  return (
    <DashboardRouteShell routePath={`/sops/capture/${id}`} fetchLines={fetchLines}>
      <CaptureStandardForm key={sop.id} businessId={business.id} initial={sop} initialSignedMedia={signedMedia} />
    </DashboardRouteShell>
  )
}
