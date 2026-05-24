import type { Metadata } from "next"

import {
  fetchBusinessForCurrentUser,
  fetchProfilesForCurrentBusiness,
  listIssueLinksForBottleneckIds,
  listIssuesForBusiness,
  listOwnerInterruptionsForBusiness,
  listSopsForBusiness,
  listTrainingModulesForBusiness,
} from "@/lib/db/queries"
import { COPY } from "@/lib/interface-copy"
import { resolveIssueLinksByBottleneck } from "@/lib/issues/links/resolve-issue-links"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { AppPageHeader } from "@/components/app-page-header"
import { IssueQuickCaptureTrigger } from "@/components/issues/issue-quick-capture-modal"
import { IssueViewTabs, parseIssuesView } from "@/components/issues/issue-view-tabs"
import { HauntingWeekPanel } from "@/components/issues/haunting-week-panel"
import { IssuesTable } from "@/components/issues/issues-table"
import { buildHauntingWeek } from "@/lib/issues/haunting-week/build-haunting-week"
import { computeCostEstimate } from "@/lib/issues/cost-estimate/compute-cost-estimate"
import { formatCostUsd } from "@/lib/issues/cost-estimate/format-cost"
import { BusinessLinkRequiredPanel } from "@/components/route-reliability/business-link-required-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"

export const metadata: Metadata = {
  title: COPY.issues.metadataTitle,
}

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; capture?: string }>
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

  const [issues, profiles, allIssues, standards, modules, interruptions] = await Promise.all([
    listIssuesForBusiness(business.id, listOpts, supabase),
    fetchProfilesForCurrentBusiness(supabase),
    listIssuesForBusiness(business.id, {}, supabase),
    listSopsForBusiness(business.id, undefined, supabase),
    listTrainingModulesForBusiness(business.id, supabase),
    listOwnerInterruptionsForBusiness(business.id, undefined, supabase),
  ])

  const linkRows = await listIssueLinksForBottleneckIds(
    issues.map((i) => i.id),
    supabase
  )
  const linksByIssue = resolveIssueLinksByBottleneck(linkRows, {
    standards,
    modules,
    interruptions,
    profiles,
  })

  const reporterNames = new Map(profiles.map((p) => [p.id, p.full_name]))
  const ownerNames = reporterNames
  const isWorkspaceEmpty = allIssues.length === 0
  const hauntingWeek = buildHauntingWeek({ issues: allIssues, history: allIssues })

  const unresolvedMonthlyBleed = allIssues
    .filter((i) => i.status !== "resolved")
    .reduce((sum, issue) => sum + computeCostEstimate({ issue, history: allIssues }).monthlyProjectionUsd, 0)

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
            <IssueQuickCaptureTrigger
              businessId={business.id}
              profiles={profiles}
              label={COPY.issues.quickCaptureCta}
              className="h-11 shrink-0"
              defaultOpen={sp.capture === "1"}
            />
          }
        />

        <div className="mt-10 space-y-8">
          {!isWorkspaceEmpty && unresolvedMonthlyBleed > 0 ? (
            <div className="rounded-xl border-2 border-rose-500/35 bg-gradient-to-br from-rose-500/10 to-amber-500/5 px-5 py-4 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {COPY.issues.costEstimateListBleedLabel}
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-rose-700 dark:text-rose-300">
                {formatCostUsd(unresolvedMonthlyBleed)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{COPY.issues.costEstimateListBleedHint}</p>
            </div>
          ) : null}
          {!isWorkspaceEmpty ? <HauntingWeekPanel items={hauntingWeek} /> : null}
          <IssueViewTabs current={view} />
          <IssuesTable
            issues={issues}
            reporterNames={reporterNames}
            ownerNames={ownerNames}
            linksByIssue={linksByIssue}
            businessId={business.id}
            profiles={profiles}
            showStarterExamples={isWorkspaceEmpty}
            scoringHistory={allIssues}
          />
        </div>
      </>
    </DashboardRouteShell>
  )
}
