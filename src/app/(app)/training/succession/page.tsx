import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getTeamSuccessionMapView } from "@/app/actions/team-succession"
import { AppPageHeader } from "@/components/app-page-header"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { TeamSuccessionMapView as SuccessionMap } from "@/components/training/team-succession-map"
import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { COPY } from "@/lib/interface-copy"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: COPY.successionMap.metadataTitle,
}

export default async function TeamSuccessionMapPage() {
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)

  if (!business) {
    const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(false)]
    return (
      <DashboardRouteShell routePath="/training/succession" fetchLines={fetchLines}>
        <>
          <AppPageHeader
            eyebrow={COPY.successionMap.eyebrow}
            title={COPY.successionMap.title}
            description={COPY.successionMap.description}
          />
          <BusinessLinkRequiredPanel description={COPY.connect.description} className="mt-10" />
        </>
      </DashboardRouteShell>
    )
  }

  const res = await getTeamSuccessionMapView()
  if (!res.ok) {
    if (res.message.includes("do not have access")) {
      redirect("/learn/training")
    }
    const fetchLines: RouteFetchLine[] = [
      lineForWorkspaceLinked(true),
      { label: "Succession map", status: "error", detail: res.message },
    ]
    return (
      <DashboardRouteShell routePath="/training/succession" fetchLines={fetchLines}>
        <p className="text-sm text-destructive">{res.message}</p>
      </DashboardRouteShell>
    )
  }

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    {
      label: "Succession roles",
      status: res.view.roles.length === 0 ? "empty" : "ok",
      detail: `${res.view.roles.length} role(s) on the map.`,
    },
  ]

  return (
    <DashboardRouteShell routePath="/training/succession" fetchLines={fetchLines}>
      <>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/training" />}>
            ← {COPY.successionMap.backToTraining}
          </Button>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/training/matrix" />}>
            {COPY.training.matrixLink}
          </Button>
        </div>

        <AppPageHeader
          eyebrow={COPY.successionMap.eyebrow}
          title={COPY.successionMap.title}
          description={COPY.successionMap.description}
          className="max-w-2xl"
        />

        <SuccessionMap view={res.view} />
      </>
    </DashboardRouteShell>
  )
}
