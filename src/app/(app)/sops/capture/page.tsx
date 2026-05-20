import type { Metadata } from "next"
import Link from "next/link"

import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { createClient } from "@/lib/supabase/server"
import { CaptureStandardForm } from "@/components/sops/capture-standard-form"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Standards Capture",
}

export default async function StandardsCapturePage() {
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)

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
            Back to Standards
          </Button>
        </div>
      </DashboardRouteShell>
    )
  }

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    { label: "Capture form", status: "ok", detail: "Workspace linked; form writes to SOP pipeline." },
  ]

  return (
    <DashboardRouteShell routePath="/sops/capture" fetchLines={fetchLines}>
      <CaptureStandardForm businessId={business.id} />
    </DashboardRouteShell>
  )
}
