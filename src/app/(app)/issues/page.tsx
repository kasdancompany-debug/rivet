import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus } from "lucide-react"

import {
  fetchBusinessForCurrentUser,
  fetchProfilesForCurrentBusiness,
  listIssuesForBusiness,
} from "@/lib/db/queries"
import { COPY } from "@/lib/interface-copy"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { AppPageHeader } from "@/components/app-page-header"
import { IssueViewTabs, parseIssuesView } from "@/components/issues/issue-view-tabs"
import { IssuesTable } from "@/components/issues/issues-table"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { Button } from "@/components/ui/button"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"

export const metadata: Metadata = {
  title: COPY.issues.metadataTitle,
}

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const sp = await searchParams
  const view = parseIssuesView(sp.view)

  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) {
    const fetchLines: RouteFetchLine[] = [lineForWorkspaceLinked(false)]
    return (
      <DashboardRouteShell routePath="/issues" fetchLines={fetchLines}>
        <>
          <AppPageHeader
            eyebrow={COPY.issues.eyebrow}
            title={COPY.issues.title}
            description={COPY.issues.description}
          />
          <BusinessLinkRequiredPanel description={COPY.connect.description} className="mt-10" />
        </>
      </DashboardRouteShell>
    )
  }

  const listOpts =
    view === "owner_required"
      ? { ownerRequired: true as const }
      : view === "unresolved"
        ? { unresolved: true as const }
        : view === "resolved"
          ? { resolvedOnly: true as const }
          : {}

  const [issues, profiles] = await Promise.all([
    listIssuesForBusiness(business.id, listOpts, supabase),
    fetchProfilesForCurrentBusiness(supabase),
  ])

  const reporterNames = new Map(profiles.map((p) => [p.id, p.full_name]))

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    {
      label: "Issues list",
      status: issues.length === 0 ? "empty" : "ok",
      detail: `${issues.length} row(s) for view "${view}".`,
      missing: issues.length === 0 ? ["issues matching filter"] : undefined,
    },
  ]

  return (
    <DashboardRouteShell routePath="/issues" fetchLines={fetchLines}>
      <>
        <AppPageHeader
          eyebrow={COPY.issues.eyebrow}
          title={COPY.issues.title}
          description={COPY.issues.description}
          actions={
            <Button nativeButton={false} render={<Link href="/issues/new" />} className="h-11 shrink-0">
              <Plus className="size-4" aria-hidden />
              {COPY.issues.logCta}
            </Button>
          }
        />

        <div className="mt-10 space-y-8">
          <IssueViewTabs current={view} />
          <IssuesTable issues={issues} reporterNames={reporterNames} />
        </div>
      </>
    </DashboardRouteShell>
  )
}
