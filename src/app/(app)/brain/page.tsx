import type { Metadata } from "next"
import Link from "next/link"

import { BusinessBrainTimeline } from "@/components/business-brain/business-brain-timeline"
import { AppPageHeader } from "@/components/app-page-header"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { loadBusinessBrainTimelineView } from "@/lib/business-brain/load-timeline-context"
import { COPY } from "@/lib/interface-copy"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: COPY.businessBrain.metadataTitle,
}

export default async function BusinessBrainPage() {
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  const p = COPY.businessBrain

  if (!business) {
    const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(false)]
    return (
      <DashboardRouteShell routePath="/brain" fetchLines={fetchLines}>
        <>
          <AppPageHeader eyebrow={p.eyebrow} title={p.title} description={p.description} />
          <BusinessLinkRequiredPanel description={COPY.connect.description} className="mt-10" />
        </>
      </DashboardRouteShell>
    )
  }

  const view = await loadBusinessBrainTimelineView(supabase)
  const items = view?.items ?? []

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    {
      label: "Timeline events",
      status: items.length === 0 ? "empty" : "ok",
      detail: `${items.length} event(s) in the last 90 days.`,
    },
  ]

  return (
    <DashboardRouteShell routePath="/brain" fetchLines={fetchLines}>
      <>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-9 text-muted-foreground"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            ← {p.backToOverview}
          </Button>
        </div>

        <AppPageHeader eyebrow={p.eyebrow} title={p.title} description={p.description} className="max-w-2xl" />

        {view ? (
          <div className="mt-10 max-w-3xl">
            <BusinessBrainTimeline view={view} />
          </div>
        ) : (
          <p className="mt-10 text-sm text-muted-foreground">{p.emptyAll}</p>
        )}
      </>
    </DashboardRouteShell>
  )
}
