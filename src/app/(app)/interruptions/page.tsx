import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { OwnerInterruptionsDashboard } from "@/components/owner-interruptions/owner-interruptions-dashboard"
import { AppPageHeader } from "@/components/app-page-header"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { Button } from "@/components/ui/button"
import { COPY } from "@/lib/interface-copy"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { getOwnerInterruptionsDashboardView } from "@/lib/owner-interruptions/get-owner-interruptions-dashboard-view"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: COPY.interruptions.metadataTitle,
}

export default async function InterruptionsPage() {
  requireAuthUser(await getServerAuthUser())
  const view = await getOwnerInterruptionsDashboardView()
  if (!view) {
    const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(false)]
    return (
      <DashboardRouteShell routePath="/interruptions" fetchLines={fetchLines}>
        <>
          <AppPageHeader
            eyebrow={COPY.interruptions.noBizEyebrow}
            title={COPY.interruptions.noBizTitle}
            description={COPY.interruptions.noBizDesc}
          />
          <BusinessLinkRequiredPanel description={COPY.connect.description} className="mt-10" />
        </>
      </DashboardRouteShell>
    )
  }

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    {
      label: "Owner interruptions (14d window)",
      status: view.recent.length === 0 && view.interruptionsThisWeek === 0 ? "empty" : "ok",
      detail: `This week: ${view.interruptionsThisWeek} events · ${view.recent.length} recent row(s) in feed.`,
      missing:
        view.recent.length === 0 && view.interruptionsThisWeek === 0
          ? ["logged interruptions in range"]
          : undefined,
    },
  ]

  return (
    <DashboardRouteShell routePath="/interruptions" fetchLines={fetchLines}>
      <>
        <AppPageHeader
          eyebrow={COPY.interruptions.eyebrow}
          title={COPY.interruptions.title}
          description={COPY.interruptions.description}
          actions={
            <Button className="h-11" nativeButton={false} render={<Link href="/interruptions/log" />}>
              {COPY.interruptions.logTitle}
            </Button>
          }
        />
        <OwnerInterruptionsDashboard view={view} />
      </>
    </DashboardRouteShell>
  )
}
