"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { IssueCostEstimatePreview } from "@/components/issues/issue-cost-estimate-preview"
import { IssuePainScorePreview, previewIssueInput } from "@/components/issues/issue-pain-score-preview"
import { COPY } from "@/lib/interface-copy"

import { createIssue } from "@/app/actions/issues"
import { ISSUE_CATEGORIES, ISSUE_SEVERITIES } from "@/lib/issues/constants"
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

export function IssueCreateForm({
  businessId,
  scoringHistory = [],
  profiles = [],
}: {
  businessId: string
  scoringHistory?: Pick<import("@/types/database").Tables<"bottlenecks">, "title" | "created_at">[]
  profiles?: { id: string; full_name: string | null; role: string | null }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<string>(ISSUE_CATEGORIES[0].value)
  const [severity, setSeverity] = useState<string>(ISSUE_SEVERITIES[1].value)
  const [ownerRequired, setOwnerRequired] = useState(false)
  const [ownerId, setOwnerId] = useState<string>(UNASSIGNED_OWNER)
  const [dueDate, setDueDate] = useState("")

  function submit() {
    setError(null)
    startTransition(async () => {
      const res = await createIssue({
        businessId,
        title,
        description: description.trim() || null,
        category,
        severity,
        ownerRequired,
        ownerId: ownerId === UNASSIGNED_OWNER ? null : ownerId,
        dueDate: dueDate.trim() || null,
      })
      if (!res.ok) {
        setError(res.message)
        return
      }
      router.push(`/issues/${res.id}`)
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

      <div className="space-y-2">
        <Label htmlFor="issue-title">{COPY.issues.issueTitleLabel}</Label>
        <Input
          id="issue-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={COPY.issues.issueTitlePlaceholder}
          maxLength={200}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="issue-desc">{COPY.issues.issueDescriptionLabel}</Label>
        <Textarea
          id="issue-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={COPY.issues.issueDescriptionPlaceholder}
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
          <Label htmlFor="issue-due">{COPY.issues.issueDueDateLabel}</Label>
          <Input
            id="issue-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={pending}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
        <Checkbox
          id="owner-req"
          checked={ownerRequired}
          onCheckedChange={(v) => setOwnerRequired(v === true)}
          disabled={pending}
        />
        <Label htmlFor="owner-req" className="cursor-pointer text-sm font-normal leading-snug">
          {COPY.issues.issueOwnerRequiredHint}
        </Label>
      </div>

      <IssueCostEstimatePreview
        issue={previewIssueInput({ title, severity, ownerRequired, category })}
        history={scoringHistory}
      />

      <IssuePainScorePreview
        issue={previewIssueInput({ title, severity, ownerRequired, category })}
        history={scoringHistory}
      />

      <Button type="button" onClick={submit} disabled={pending || !title.trim()}>
        {pending ? COPY.issues.issueSaving : COPY.issues.saveCta}
      </Button>
    </div>
  )
}
