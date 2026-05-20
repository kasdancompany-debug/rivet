import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { COPY } from "@/lib/interface-copy"
import {
  fetchBusinessForCurrentUser,
  fetchPrimaryOwnerEscapePlan,
  listOwnerEscapePlanTasks,
} from "@/lib/db/queries"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { AppPageHeader } from "@/components/app-page-header"
import { EscapeReadinessPanel } from "@/components/escape-readiness/escape-readiness-panel"
import { EscapePlanJourney } from "@/components/escape-plan/escape-plan-journey"
import { EscapePlanStart } from "@/components/escape-plan/escape-plan-start"
import { getEscapeReadinessData } from "@/lib/escape-readiness/get-escape-readiness-data"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"

export const metadata: Metadata = {
  title: COPY.escape.metadataTitle,
}

export default async function EscapePlanPage() {
  requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) {
    const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(false)]
    return (
      <DashboardRouteShell routePath="/escape-plan" fetchLines={fetchLines}>
        <>
          <AppPageHeader
            eyebrow={COPY.escape.noBizEyebrow}
            title={COPY.escape.noBizTitle}
            description={COPY.escape.noBizDesc}
          />
          <BusinessLinkRequiredPanel description={COPY.connect.description} className="mt-10" />
        </>
      </DashboardRouteShell>
    )
  }

  const [plan, escapeReadiness] = await Promise.all([
    fetchPrimaryOwnerEscapePlan(business.id, supabase),
    getEscapeReadinessData(),
  ])
  const tasks = plan ? await listOwnerEscapePlanTasks(plan.id, supabase) : []

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    {
      label: "Escape plan",
      status: plan ? "ok" : "empty",
      detail: plan ? `Plan loaded · ${tasks.length} task row(s).` : "No primary escape plan row yet.",
      missing: plan ? undefined : ["owner_escape_plan"],
    },
  ]

  return (
    <DashboardRouteShell routePath="/escape-plan" fetchLines={fetchLines}>
      <>
        <AppPageHeader eyebrow={COPY.escape.eyebrow} title={COPY.escape.title} description={COPY.escape.desc} />
        <EscapeReadinessPanel model={escapeReadiness} className="mt-8" />
        {!plan ? (
          <EscapePlanStart businessName={business.name} />
        ) : (
          <EscapePlanJourney plan={plan} tasks={tasks} businessName={business.name} />
        )}
      </>
    </DashboardRouteShell>
  )
}
