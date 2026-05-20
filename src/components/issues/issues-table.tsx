import Link from "next/link"
import { AlertCircle } from "lucide-react"

import { formatIssueCategory, formatIssueSeverity } from "@/lib/issues/constants"
import type { Tables } from "@/types/database"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function statusBadge(status: Tables<"bottlenecks">["status"]) {
  switch (status) {
    case "open":
      return "border-amber-500/30 bg-amber-500/5 text-amber-950 dark:text-amber-200"
    case "in_progress":
      return "border-sky-500/25 bg-sky-500/5 text-sky-950 dark:text-sky-200"
    default:
      return "border-emerald-500/25 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200"
  }
}

function statusLabel(status: Tables<"bottlenecks">["status"]) {
  switch (status) {
    case "open":
      return "Open"
    case "in_progress":
      return "In progress"
    default:
      return "Resolved"
  }
}

export function IssuesTable({
  issues,
  reporterNames,
}: {
  issues: Tables<"bottlenecks">[]
  reporterNames: Map<string, string>
}) {
  if (issues.length === 0) {
    return (
      <EmptyState
        icon={AlertCircle}
        eyebrow="Bottlenecks"
        title="Nothing in this view."
        description="Either the queue is clear or filters are hiding rows. When something blocks the standard, log it here so the fix lives in the business—not in your texts."
      >
        <Button className="w-full sm:w-auto" nativeButton={false} render={<Link href="/issues/new" />}>
          Log a bottleneck
        </Button>
      </EmptyState>
    )
  }

  return (
    <ul className="space-y-3">
      {issues.map((row) => (
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
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatIssueCategory(row.category)}
                  <span className="mx-2 text-border">·</span>
                  {formatIssueSeverity(row.severity)}
                  <span className="mx-2 text-border">·</span>
                  Reported by {reporterNames.get(row.reported_by) ?? "Unknown"}
                </p>
              </div>
              <p className="shrink-0 text-sm tabular-nums text-muted-foreground sm:pt-0.5">
                {new Date(row.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
