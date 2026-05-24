"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { Link2, Trash2 } from "lucide-react"

import { addIssueLink, removeIssueLink } from "@/app/actions/issue-links"
import { IssueLinkCard } from "@/components/issues/issue-link-card"
import { ISSUE_LINK_KINDS } from "@/lib/issues/links/constants"
import type { IssueLinkPickerOptions, IssueLinkView } from "@/lib/issues/links/types"
import { COPY } from "@/lib/interface-copy"
import type { IssueLinkKind } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function targetOptionsForKind(kind: IssueLinkKind, options: IssueLinkPickerOptions) {
  switch (kind) {
    case "standard":
      return options.standards.map((s) => ({
        id: s.id,
        label: s.title,
        detail: s.status.replace(/_/g, " "),
      }))
    case "training_module":
      return options.modules.map((m) => ({
        id: m.id,
        label: m.title,
        detail: null,
      }))
    case "owner_interruption":
      return options.interruptions.map((i) => ({
        id: i.id,
        label: i.summary,
        detail: new Date(i.occurredAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      }))
    case "staff_member":
      return options.profiles.map((p) => ({
        id: p.id,
        label: p.full_name?.trim() || "Team member",
        detail: p.role,
      }))
    default:
      return []
  }
}

export function IssueLinksPanel({
  issueId,
  links: initialLinks,
  pickerOptions,
}: {
  issueId: string
  links: IssueLinkView[]
  pickerOptions: IssueLinkPickerOptions
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [kind, setKind] = useState<IssueLinkKind>("standard")
  const [targetId, setTargetId] = useState("")

  const targetChoices = useMemo(() => targetOptionsForKind(kind, pickerOptions), [kind, pickerOptions])
  const linkedTargetIds = useMemo(
    () => new Set(initialLinks.filter((l) => l.kind === kind).map((l) => l.targetId)),
    [initialLinks, kind]
  )
  const availableTargets = targetChoices.filter((t) => !linkedTargetIds.has(t.id))

  function addLink() {
    if (!targetId) return
    setError(null)
    startTransition(async () => {
      const res = await addIssueLink({ issueId, kind, targetId })
      if (!res.ok) {
        setError(res.message)
        return
      }
      setTargetId("")
      router.refresh()
    })
  }

  function removeLink(linkId: string) {
    setError(null)
    startTransition(async () => {
      const res = await removeIssueLink(linkId, issueId)
      if (!res.ok) setError(res.message)
      else router.refresh()
    })
  }

  return (
    <section className="mx-auto max-w-xl space-y-4 rounded-xl border border-border/60 bg-muted/10 px-4 py-5 sm:px-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Link2 className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-semibold text-foreground">{COPY.issues.issueLinksTitle}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{COPY.issues.issueLinksHint}</p>
      </div>

      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {initialLinks.length === 0 ? (
        <p className="text-sm text-muted-foreground">{COPY.issues.issueLinksEmpty}</p>
      ) : (
        <ul className="space-y-2">
          {initialLinks.map((link) => (
            <li key={link.id} className="relative">
              <IssueLinkCard link={link} />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                disabled={pending}
                aria-label={COPY.issues.issueLinksRemoveAria(link.title)}
                onClick={() => removeLink(link.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 rounded-lg border border-border/50 bg-background/80 px-3 py-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{COPY.issues.issueLinksAddKind}</Label>
            <Select
              value={kind}
              onValueChange={(v) => {
                if (v) {
                  setKind(v as IssueLinkKind)
                  setTargetId("")
                }
              }}
              disabled={pending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_LINK_KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{COPY.issues.issueLinksAddTarget}</Label>
            <Select
              value={targetId}
              onValueChange={(v) => {
                if (v) setTargetId(v)
              }}
              disabled={pending || availableTargets.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={COPY.issues.issueLinksAddTargetPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {availableTargets.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                    {t.detail ? ` · ${t.detail}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="button" size="sm" disabled={pending || !targetId} onClick={addLink}>
          {pending ? COPY.issues.issueLinksAdding : COPY.issues.issueLinksAddCta}
        </Button>
      </div>
    </section>
  )
}
