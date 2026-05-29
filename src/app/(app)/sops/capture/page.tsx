import type { Metadata } from "next"
import Link from "next/link"

import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { createClient } from "@/lib/supabase/server"
import { CapturePlayExperience } from "@/components/sops/capture-play-experience"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: COPY.nav.standardsCapture,
}

export default async function StandardsCapturePage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string; title?: string }>
}) {
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  const sp = await searchParams
  const initialPlayPrompt = sp.prompt?.trim() ?? ""

  if (!business) {
    const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(false)]
    return (
      <DashboardRouteShell routePath="/sops/capture" fetchLines={fetchLines}>
        <div className="space-y-4">
          <BusinessLinkRequiredPanel
            title="Workspace required"
            description="Link a business in Settings before capturing standards on the record."
            className="border-border/60 bg-card/70 shadow-sm"
          />
          <Button variant="outline" nativeButton={false} render={<Link href="/sops" />}>
            {COPY.sops.backToPlays}
          </Button>
        </div>
      </DashboardRouteShell>
    )
  }

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    { label: "Capture", status: "ok", detail: "Describe a problem—Rivet builds the full system." },
  ]

  return (
    <DashboardRouteShell routePath="/sops/capture" fetchLines={fetchLines}>
      <CapturePlayExperience
        businessId={business.id}
        initialPlayPrompt={initialPlayPrompt}
      />
    </DashboardRouteShell>
  )
}
