"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { IssueCostEstimatePreview } from "@/components/issues/issue-cost-estimate-preview"
import { IssuePainScorePreview } from "@/components/issues/issue-pain-score-preview"
import { updateIssue } from "@/app/actions/issues"
import {
  ISSUE_CATEGORIES,
  ISSUE_SEVERITIES,
  ISSUE_STATUSES,
} from "@/lib/issues/constants"
import { COPY } from "@/lib/interface-copy"
import type { IssueStatus, Tables } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const UNASSIGNED_OWNER = "__unassigned__"

export function IssueDetailForm({
  issue,
  scoringHistory = [],
  profiles = [],
}: {
  issue: Tables<"bottlenecks">
  scoringHistory?: Pick<Tables<"bottlenecks">, "title" | "created_at">[]
  profiles?: { id: string; full_name: string | null; role: string | null }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [title, setTitle] = useState(issue.title)
  const [description, setDescription] = useState(issue.description ?? "")
  const [category, setCategory] = useState(issue.category)
  const [severity, setSeverity] = useState(issue.severity)
  const [status, setStatus] = useState<IssueStatus>(issue.status)
  const [ownerRequired, setOwnerRequired] = useState(issue.owner_required)
  const [ownerId, setOwnerId] = useState(issue.owner_id ?? UNASSIGNED_OWNER)
  const [dueDate, setDueDate] = useState(issue.due_date ?? "")

  function save() {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const res = await updateIssue(issue.id, {
        title,
        description: description.trim() || null,
        category,
        severity,
        status,
        ownerRequired,
        ownerId: ownerId === UNASSIGNED_OWNER ? null : ownerId,
        dueDate: dueDate.trim() || null,
      })
      if (!res.ok) {
        setError(res.message)
        return
      }
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {saved && !error ? (
        <p className="text-sm text-muted-foreground">{COPY.issues.issueSaved}</p>
      ) : null}

      <IssueCostEstimatePreview
        issue={{
          title,
          category,
          severity,
          owner_required: ownerRequired,
          status,
          created_at: issue.created_at,
        }}
        history={scoringHistory}
      />

      <IssuePainScorePreview
        issue={{
          title,
          severity,
          owner_required: ownerRequired,
          status,
          created_at: issue.created_at,
        }}
        history={scoringHistory}
      />

      <div className="space-y-2">
        <Label htmlFor="edit-title">{COPY.issues.issueTitleLabel}</Label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-desc">{COPY.issues.issueDescriptionLabel}</Label>
        <Textarea
          id="edit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          disabled={pending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{COPY.issues.issueCategoryLabel}</Label>
          <Select
            value={category}
            onValueChange={(v) => {
              if (v) setCategory(v)
            }}
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ISSUE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
              {!ISSUE_CATEGORIES.some((c) => c.value === category) ? (
                <SelectItem value={category}>
                  Legacy: {category.replace(/_/g, " ")}
                </SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{COPY.issues.issueSeverityLabel}</Label>
          <Select
            value={severity}
            onValueChange={(v) => {
              if (v) setSeverity(v)
            }}
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ISSUE_SEVERITIES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
              {!ISSUE_SEVERITIES.some((s) => s.value === severity) ? (
                <SelectItem value={severity}>Legacy: {severity}</SelectItem>
              ) : null}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{COPY.issues.issueOwnerLabel}</Label>
          <Select
            value={ownerId}
            onValueChange={(v) => {
              if (v) setOwnerId(v)
            }}
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue placeholder={COPY.issues.issueOwnerPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNASSIGNED_OWNER}>{COPY.issues.issueOwnerUnassigned}</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.full_name?.trim() || "Team member"}
                  {p.role ? ` · ${p.role}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-due">{COPY.issues.issueDueDateLabel}</Label>
          <Input
            id="edit-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={pending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{COPY.issues.issueStatusLabel}</Label>
        <Select
          value={status}
          onValueChange={(v) => {
            if (v) setStatus(v as IssueStatus)
          }}
          disabled={pending}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ISSUE_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
        <Checkbox
          id="edit-owner"
          checked={ownerRequired}
          onCheckedChange={(v) => setOwnerRequired(v === true)}
          disabled={pending}
        />
        <Label htmlFor="edit-owner" className="cursor-pointer text-sm font-normal leading-snug">
          {COPY.issues.issueOwnerRequiredOverviewHint}
        </Label>
      </div>

      <Button type="button" onClick={save} disabled={pending || !title.trim()}>
        {pending ? COPY.issues.issueSaving : COPY.issues.issueSaveChanges}
      </Button>

      <p className="text-xs text-muted-foreground">
        {COPY.issues.issueReportedAt}{" "}
        {new Date(issue.created_at).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
        .
      </p>
    </div>
  )
}
