"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { updateIssue } from "@/app/actions/issues"
import { ISSUE_CATEGORIES, ISSUE_SEVERITIES } from "@/lib/issues/constants"
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

const STATUSES: { value: IssueStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
]

export function IssueDetailForm({ issue }: { issue: Tables<"bottlenecks"> }) {
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
        <p className="text-sm text-muted-foreground">Saved.</p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="edit-title">Title</Label>
        <Input
          id="edit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-desc">Description</Label>
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
          <Label>Category</Label>
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
          <Label>Severity</Label>
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

      <div className="space-y-2">
        <Label>Status</Label>
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
            {STATUSES.map((s) => (
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
          Only you can unblock (shows on Overview)
        </Label>
      </div>

      <Button type="button" onClick={save} disabled={pending || !title.trim()}>
        {pending ? "Saving…" : "Save changes"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Reported{" "}
        {new Date(issue.created_at).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
        .
      </p>
    </div>
  )
}
