import Link from "next/link"
import { AlertCircle } from "lucide-react"

import { COPY } from "@/lib/interface-copy"
import { ISSUE_REPEAT_FIX_THRESHOLD } from "@/lib/issues/fix-recommendation/analyze-issue-fix"
import { countSimilarIssuesInWindow } from "@/lib/issues/pain-score/compute-pain-score"
import { computeCostEstimate } from "@/lib/issues/cost-estimate/compute-cost-estimate"
import { IssueCostEstimateBadge } from "@/components/issues/issue-cost-estimate-badge"
import { IssueLinkChips } from "@/components/issues/issue-link-card"
import { IssueQuickCaptureTrigger } from "@/components/issues/issue-quick-capture-modal"
import { IssueStarterExamples } from "@/components/issues/issue-starter-examples"
import type { IssueLinkView } from "@/lib/issues/links/types"
import { IssuePainScoreBadge } from "@/components/issues/issue-pain-score-badge"
import { rankIssuesByPainScore } from "@/lib/issues/pain-score/compute-pain-score"
import { formatIssueCategory, formatIssueSeverity, formatIssueStatus, issueStatusBadgeClass } from "@/lib/issues/constants"
import type { Tables } from "@/types/database"
import { EmptyState } from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function statusBadge(status: Tables<"bottlenecks">["status"]) {
  return issueStatusBadgeClass(status)
}

function statusLabel(status: Tables<"bottlenecks">["status"]) {
  return formatIssueStatus(status)
}

function formatDueDate(value: string | null): string | null {
  if (!value) return null
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })
}

export function IssuesTable({
  issues,
  reporterNames,
  ownerNames,
  linksByIssue = new Map<string, IssueLinkView[]>(),
  businessId,
  profiles = [],
  showStarterExamples = false,
  scoringHistory = [],
}: {
  issues: Tables<"bottlenecks">[]
  reporterNames: Map<string, string>
  ownerNames: Map<string, string>
  linksByIssue?: Map<string, IssueLinkView[]>
  businessId: string
  profiles?: { id: string; full_name: string | null; role: string | null }[]
  showStarterExamples?: boolean
  scoringHistory?: Pick<Tables<"bottlenecks">, "title" | "created_at">[]
}) {
  if (issues.length === 0) {
    if (showStarterExamples) {
      return <IssueStarterExamples businessId={businessId} profiles={profiles} />
    }

    return (
      <EmptyState
        icon={AlertCircle}
        eyebrow={COPY.issues.title}
        title={COPY.issues.emptyFilterTitle}
        description={COPY.issues.emptyDescription}
      >
        <IssueQuickCaptureTrigger businessId={businessId} profiles={profiles} className="w-full sm:w-auto" />
      </EmptyState>
    )
  }

  const ranked = rankIssuesByPainScore(issues, scoringHistory.length > 0 ? scoringHistory : issues)
  const history = scoringHistory.length > 0 ? scoringHistory : issues

  return (
    <ul className="space-y-3">
      {ranked.map(({ issue: row, pain }) => {
        const repeatCount = countSimilarIssuesInWindow(scoringHistory.length > 0 ? scoringHistory : issues, row)
        const showFixBadge = repeatCount >= ISSUE_REPEAT_FIX_THRESHOLD
        const rowLinks = linksByIssue.get(row.id) ?? []
        const cost = computeCostEstimate({ issue: row, history })

        return (
          <li key={row.id}>
            <Card className="border-border/60 py-0 shadow-sm transition-colors hover:bg-muted/[0.15]">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/issues/${row.id}`}
                      className="text-base font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {row.title}
                    </Link>
                    <Badge variant="outline" className={cn("font-medium", statusBadge(row.status))}>
                      {statusLabel(row.status)}
                    </Badge>
                    {row.owner_required ? (
                      <Badge
                        variant="outline"
                        className="font-medium uppercase tracking-wide text-rose-800 dark:text-rose-300"
                      >
                        Needs you
                      </Badge>
                    ) : null}
                  {showFixBadge ? (
                    <Badge variant="secondary" className="text-[0.62rem] font-medium">
                      {COPY.issues.fixRecommendationRepeatBadge}
                    </Badge>
                  ) : null}
                  <IssueCostEstimateBadge estimate={cost} />
                </div>
                  <p className="text-sm text-muted-foreground">
                    {formatIssueCategory(row.category)}
                    <span className="mx-2 text-border">·</span>
                    {formatIssueSeverity(row.severity)}
                    <span className="mx-2 text-border">·</span>
                    Owner {row.owner_id ? ownerNames.get(row.owner_id) ?? "Unknown" : "Unassigned"}
                    {row.due_date ? (
                      <>
                        <span className="mx-2 text-border">·</span>
                        Due {formatDueDate(row.due_date)}
                      </>
                    ) : null}
                    <span className="mx-2 text-border">·</span>
                    Reported by {reporterNames.get(row.reported_by) ?? "Unknown"}
                  </p>
                  {rowLinks.length > 0 ? <IssueLinkChips links={rowLinks} /> : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5 sm:pt-0.5">
                  <IssuePainScoreBadge pain={pain} showLabel className="text-xs" />
                  <p className="text-sm tabular-nums text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
