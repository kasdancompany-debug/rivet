"use client"

import { useMemo } from "react"

import { IssuePainScorePanel } from "@/components/issues/issue-pain-score-panel"
import { computePainScore } from "@/lib/issues/pain-score/compute-pain-score"
import type { IssueStatus, Tables } from "@/types/database"

export function IssuePainScorePreview({
  issue,
  history = [],
}: {
  issue: Pick<
    Tables<"bottlenecks">,
    "title" | "severity" | "owner_required" | "status" | "created_at"
  >
  history?: Pick<Tables<"bottlenecks">, "title" | "created_at">[]
}) {
  const pain = useMemo(
    () => computePainScore({ issue, history }),
    [
      issue.title,
      issue.severity,
      issue.owner_required,
      issue.status,
      issue.created_at,
      history,
    ]
  )

  return <IssuePainScorePanel pain={pain} />
}

export function previewIssueInput(input: {
  title: string
  severity: string
  ownerRequired: boolean
  category?: string
  status?: IssueStatus
  createdAt?: string
}): Pick<
  Tables<"bottlenecks">,
  "title" | "category" | "severity" | "owner_required" | "status" | "created_at"
> {
  return {
    title: input.title.trim() || "New issue",
    category: input.category ?? "other",
    severity: input.severity,
    owner_required: input.ownerRequired,
    status: input.status ?? "not_started",
    created_at: input.createdAt ?? new Date().toISOString(),
  }
}
