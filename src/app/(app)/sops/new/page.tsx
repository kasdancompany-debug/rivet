import type { Metadata } from "next"
import Link from "next/link"

import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { createClient } from "@/lib/supabase/server"
import { SopForm } from "@/components/sops/sop-form"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: COPY.sops.new,
}

export default async function NewSopPage() {
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)

  if (!business) {
    const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(false)]
    return (
      <DashboardRouteShell routePath="/sops/new" fetchLines={fetchLines}>
        <div className="space-y-4">
          <BusinessLinkRequiredPanel
            title="Workspace required"
            description="Link your account to a business before authoring plays on the record."
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
    { label: "New SOP form", status: "ok", detail: "Create mode for workspace." },
  ]

  return (
    <DashboardRouteShell routePath="/sops/new" fetchLines={fetchLines}>
      <SopForm businessId={business.id} mode="create" />
    </DashboardRouteShell>
  )
}
