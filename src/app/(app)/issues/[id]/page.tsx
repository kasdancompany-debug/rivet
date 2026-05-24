import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import {
  fetchBusinessForCurrentUser,
  fetchIssueById,
  fetchProfilesForCurrentBusiness,
  listIssueLifecycleEvents,
  listIssueLinksForBottleneck,
  listIssuesForBusiness,
  listOwnerInterruptionsForBusiness,
  listSopsForBusiness,
  listTrainingModulesForBusiness,
  listTrainingProgressForBusinessModules,
} from "@/lib/db/queries"
import { COPY } from "@/lib/interface-copy"
import { syncIssuePatternDetected } from "@/app/actions/issue-lifecycle"
import { analyzeIssueFixRecommendation } from "@/lib/issues/fix-recommendation/analyze-issue-fix"
import { computeCostEstimate } from "@/lib/issues/cost-estimate/compute-cost-estimate"
import { buildIssueLifecycle } from "@/lib/issues/lifecycle/build-issue-lifecycle"
import { issueLifecycleCopy } from "@/lib/issues/lifecycle/copy"
import { resolveIssueLinks } from "@/lib/issues/links/resolve-issue-links"
import { listRivetIndexSnapshotsLastDays } from "@/lib/rivet-score/data"
import { lineForWorkspaceLinked } from "@/lib/route-reliability/diagnostic-builders"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"
import { IssueCostEstimatePanel } from "@/components/issues/issue-cost-estimate-panel"
import { IssueDetailForm } from "@/components/issues/issue-detail-form"
import { IssueFixRecommendationPanel } from "@/components/issues/issue-fix-recommendation-panel"
import { IssueLifecyclePanel } from "@/components/issues/issue-lifecycle-panel"
import { IssueLinksPanel } from "@/components/issues/issue-links-panel"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { Button } from "@/components/ui/button"

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const issue = await fetchIssueById(id, supabase)
  if (!issue) return { title: COPY.issues.detailFallbackTitle }
  return { title: issue.title }
}

export default async function IssueDetailPage({ params }: Props) {
  const { id } = await params
  requireAuthUser(await getServerAuthUser())
  const supabase = await createClient()
  const [business, issue] = await Promise.all([
    fetchBusinessForCurrentUser(supabase),
    fetchIssueById(id, supabase),
  ])

  if (!issue) notFound()
  if (!business || business.id !== issue.business_id) notFound()

  const [history, profiles, standards, modules, interruptions, linkRows, lifecycleEvents, dependencySnapshots] =
    await Promise.all([
      listIssuesForBusiness(business.id, {}, supabase),
      fetchProfilesForCurrentBusiness(supabase),
      listSopsForBusiness(business.id, undefined, supabase),
      listTrainingModulesForBusiness(business.id, supabase),
      listOwnerInterruptionsForBusiness(business.id, undefined, supabase),
      listIssueLinksForBottleneck(issue.id, supabase),
      listIssueLifecycleEvents(issue.id, supabase),
      listRivetIndexSnapshotsLastDays(business.id, 30, supabase),
    ])

  const trainingProgress = await listTrainingProgressForBusinessModules(
    modules.map((m) => m.id),
    supabase
  )

  const issueLinks = resolveIssueLinks(linkRows, {
    standards,
    modules,
    interruptions,
    profiles,
  })

  const pickerOptions = {
    standards: standards.map((s) => ({ id: s.id, title: s.title, status: s.status })),
    modules: modules.map((m) => ({ id: m.id, title: m.title })),
    interruptions: interruptions.map((i) => ({
      id: i.id,
      summary: i.summary,
      occurredAt: i.occurred_at,
    })),
    profiles,
  }

  const fixRecommendation = analyzeIssueFixRecommendation({
    issue,
    history,
    profiles,
    standards,
    modules,
    businessOwnerId: business.owner_id,
  })

  if (fixRecommendation.isRepeated) {
    await syncIssuePatternDetected({
      businessId: business.id,
      issueId: issue.id,
      repeatCount: fixRecommendation.repeatCount,
    })
  }

  const lifecycleCopy = issueLifecycleCopy()
  const linkedModuleIds = linkRows.filter((l) => l.kind === "training_module").map((l) => l.target_id)
  const lifecycle = buildIssueLifecycle({
    issue,
    history,
    fixRecommendation,
    linkKinds: linkRows.map((l) => l.kind),
    linkedModuleIds,
    trainingProgress,
    lifecycleEvents,
    dependencySnapshots,
    stageLabels: lifecycleCopy.stageLabels,
    stageDetails: lifecycleCopy.stageDetails,
  })

  const costEstimate = computeCostEstimate({ issue, history })
  const suggestedModuleId = linkedModuleIds[0] ?? null
  const suggestedEmployeeId = fixRecommendation.suggestedOwner?.profileId ?? null

  const fetchLines: RouteFetchLine[] = [
    lineForWorkspaceLinked(true),
    {
      label: "Issue row",
      status: "ok",
      detail: `Loaded issue ${issue.id} · status ${issue.status}.`,
    },
  ]

  return (
    <DashboardRouteShell routePath={`/issues/${id}`} fetchLines={fetchLines}>
      <div className="space-y-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 mb-4 h-8 px-2 text-muted-foreground"
            nativeButton={false}
            render={<Link href="/issues" />}
          >
            <ArrowLeft className="mr-1 size-4" aria-hidden />
            {COPY.issues.backToAll}
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
            {issue.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Update status as the team clears it. Resolving removes the load from your overview when nothing else is blocking.
          </p>
        </div>
        <IssueLifecyclePanel
          lifecycle={lifecycle}
          businessId={business.id}
          issueId={issue.id}
          canAssignTraining={Boolean(suggestedModuleId && suggestedEmployeeId)}
          linkedModuleId={suggestedModuleId}
          suggestedEmployeeId={suggestedEmployeeId}
        />
        <IssueCostEstimatePanel estimate={costEstimate} status={issue.status} prominent />
        <IssueFixRecommendationPanel
          businessId={business.id}
          issueId={issue.id}
          recommendation={fixRecommendation}
        />
        <IssueLinksPanel issueId={issue.id} links={issueLinks} pickerOptions={pickerOptions} />
        <IssueDetailForm issue={issue} scoringHistory={history} profiles={profiles} />
      </div>
    </DashboardRouteShell>
  )
}
