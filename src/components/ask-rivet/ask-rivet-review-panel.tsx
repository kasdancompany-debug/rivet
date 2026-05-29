"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Check, Pencil, ShieldCheck } from "lucide-react"

import {
  approveAskRivetQuery,
  improveAskRivetQuery,
  type AskRivetReviewQueueItem,
} from "@/app/actions/ask-rivet-review"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

function statusLabel(status: AskRivetReviewQueueItem["reviewStatus"]): string {
  switch (status) {
    case "pending":
      return COPY.askRivet.reviewStatusPending
    case "improved":
      return COPY.askRivet.reviewStatusImproved
    default:
      return status
  }
}

export function AskRivetReviewPanel({ items }: { items: AskRivetReviewQueueItem[] }) {
  const [queue, setQueue] = useState(items)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (queue.length === 0) {
    return (
      <section className="rounded-2xl border border-border/60 bg-card/80 p-5">
        <h2 className="text-lg font-semibold tracking-tight">{COPY.askRivet.reviewTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{COPY.askRivet.reviewEmpty}</p>
      </section>
    )
  }

  function remove(id: string) {
    setQueue((prev) => prev.filter((i) => i.id !== id))
  }

  function onApprove(id: string) {
    setError(null)
    startTransition(async () => {
      const res = await approveAskRivetQuery(id)
      if (!res.ok) {
        setError(res.message)
        return
      }
      remove(id)
    })
  }

  function onImprove(id: string) {
    setError(null)
    startTransition(async () => {
      const res = await improveAskRivetQuery({ queryId: id, improvedAnswer: draft })
      if (!res.ok) {
        setError(res.message)
        return
      }
      setEditingId(null)
      setDraft("")
      remove(id)
    })
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-card/80 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-border/50 bg-muted/30">
          <ShieldCheck className="size-5 text-primary" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{COPY.askRivet.reviewTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{COPY.askRivet.reviewLead}</p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <ul className="mt-5 space-y-4">
        {queue.map((item) => (
          <li key={item.id} className="rounded-xl border border-border/50 bg-background/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  item.reviewStatus === "pending"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100"
                    : "border-violet-500/30 bg-violet-500/10 text-violet-950 dark:text-violet-100"
                )}
              >
                {statusLabel(item.reviewStatus)}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {COPY.askRivet.confidenceScoreLabel}: {item.confidenceScore}%
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{item.questionText}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.quickAnswer}</p>
            {item.playTitle && item.standardHref ? (
              <Link
                href={item.standardHref}
                className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
              >
                {COPY.askRivet.sourcePlayLabel}: {item.playTitle}
              </Link>
            ) : null}

            {editingId === item.id ? (
              <div className="mt-4 space-y-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="min-h-[6rem] text-sm"
                  placeholder={COPY.askRivet.reviewImprovePlaceholder}
                  disabled={pending}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending || draft.trim().length < 8}
                    onClick={() => onImprove(item.id)}
                  >
                    {COPY.askRivet.reviewSaveImprovement}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      setEditingId(null)
                      setDraft("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={pending}
                  onClick={() => onApprove(item.id)}
                >
                  <Check className="size-3.5" aria-hidden />
                  {COPY.askRivet.reviewApprove}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={pending}
                  onClick={() => {
                    setEditingId(item.id)
                    setDraft(item.quickAnswer)
                  }}
                >
                  <Pencil className="size-3.5" aria-hidden />
                  {COPY.askRivet.reviewImprove}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
