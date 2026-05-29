import type { Metadata } from "next"
import Link from "next/link"

import { HighFrictionAlertsPanel } from "@/components/high-friction/high-friction-alerts-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { AppPageHeader } from "@/components/app-page-header"
import { Button } from "@/components/ui/button"
import { COPY } from "@/lib/interface-copy"
import { getHighFrictionAlertsView } from "@/lib/high-friction-alerts/get-high-friction-alerts"
import { linesForAlerts } from "@/lib/route-reliability/diagnostic-builders"

export const metadata: Metadata = {
  title: COPY.highFriction.metadataTitle,
  description: COPY.highFriction.metadataDescription,
}

export default async function HighFrictionAlertsPage() {
  const view = await getHighFrictionAlertsView()
  const fetchLines = linesForAlerts(view)

  return (
    <DashboardRouteShell routePath="/alerts" fetchLines={fetchLines}>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <AppPageHeader
            eyebrow={COPY.highFriction.eyebrow}
            title={COPY.highFriction.pageTitle}
            description={COPY.highFriction.pageDescription}
            className="mb-0 sm:max-w-2xl"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-10" nativeButton={false} render={<Link href="/ask" />}>
              {COPY.nav.askRivet}
            </Button>
            <Button variant="outline" size="sm" className="h-10" nativeButton={false} render={<Link href="/interruptions" />}>
              {COPY.interruptions.featureTitle}
            </Button>
          </div>
        </div>

        {view ? (
          <HighFrictionAlertsPanel alerts={view.alerts} />
        ) : (
          <p className="text-sm text-muted-foreground">{COPY.highFriction.setupRequired}</p>
        )}
      </div>
    </DashboardRouteShell>
  )
}
