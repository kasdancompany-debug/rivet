"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

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

export function IssueCreateForm({ businessId }: { businessId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<string>(ISSUE_CATEGORIES[0].value)
  const [severity, setSeverity] = useState<string>(ISSUE_SEVERITIES[1].value)
  const [ownerRequired, setOwnerRequired] = useState(false)

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
        <Label htmlFor="issue-title">Title</Label>
        <Input
          id="issue-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short summary"
          maxLength={200}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="issue-desc">Description</Label>
        <Textarea
          id="issue-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened, what you tried, what you need next"
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
            </SelectContent>
          </Select>
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
          This needs you—the owner—to decide or act before the team can move on.
        </Label>
      </div>

      <Button type="button" onClick={submit} disabled={pending || !title.trim()}>
        {pending ? "Saving…" : "Save bottleneck"}
      </Button>
    </div>
  )
}
