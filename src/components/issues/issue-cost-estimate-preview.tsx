"use client"

import { useMemo } from "react"

import { IssueCostEstimatePanel } from "@/components/issues/issue-cost-estimate-panel"
import { computeCostEstimate } from "@/lib/issues/cost-estimate/compute-cost-estimate"
import type { IssueStatus, Tables } from "@/types/database"

export function IssueCostEstimatePreview({
  issue,
  history = [],
  prominent = false,
}: {
  issue: Pick<
    Tables<"bottlenecks">,
    "title" | "category" | "severity" | "owner_required" | "status" | "created_at"
  >
  history?: Pick<Tables<"bottlenecks">, "title" | "created_at">[]
  prominent?: boolean
}) {
  const estimate = useMemo(
    () => computeCostEstimate({ issue, history }),
    [
      issue.title,
      issue.category,
      issue.severity,
      issue.owner_required,
      issue.status,
      issue.created_at,
      history,
    ]
  )

  return <IssueCostEstimatePanel estimate={estimate} status={issue.status} prominent={prominent} />
}
