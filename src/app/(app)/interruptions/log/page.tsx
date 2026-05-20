import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { OwnerInterruptionLogForm } from "@/components/owner-interruptions/owner-interruption-log-form"
import { AppPageHeader } from "@/components/app-page-header"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { Button } from "@/components/ui/button"
import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { COPY } from "@/lib/interface-copy"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: `${COPY.interruptions.logTitle} · ${COPY.interruptions.metadataTitle}`,
}

export default async function InterruptionsLogPage() {
  requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) {
    const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(false)]
    return (
      <DashboardRouteShell routePath="/interruptions/log" fetchLines={fetchLines}>
        <>
          <AppPageHeader
            eyebrow={COPY.interruptions.logEyebrow}
            title={COPY.interruptions.logTitle}
            description={COPY.interruptions.noBizDesc}
          />
          <BusinessLinkRequiredPanel description={COPY.connect.description} className="mt-10" />
        </>
      </DashboardRouteShell>
    )
  }

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    { label: "Log form", status: "ok", detail: "Workspace linked; log posts to owner_interruptions." },
  ]

  return (
    <DashboardRouteShell routePath="/interruptions/log" fetchLines={fetchLines}>
      <>
        <AppPageHeader
          eyebrow={COPY.interruptions.logEyebrow}
          title={COPY.interruptions.logTitle}
          description={COPY.interruptions.logDescription}
          actions={
            <Button variant="outline" className="h-11" nativeButton={false} render={<Link href="/interruptions" />}>
              {COPY.interruptions.dashboardCta}
            </Button>
          }
        />
        <OwnerInterruptionLogForm businessId={business.id} />
      </>
    </DashboardRouteShell>
  )
}
