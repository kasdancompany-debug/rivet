"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Check, Circle, X } from "lucide-react"

import type { FirstDayChecklistView } from "@/lib/dashboard/first-day-checklist"
import {
  firstDayChecklistDismissStorageKey,
  firstDayEscapeViewedStorageKey,
} from "@/lib/dashboard/first-day-checklist"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function readDismissed(businessId: string): boolean {
  try {
    return localStorage.getItem(firstDayChecklistDismissStorageKey(businessId)) === "1"
  } catch {
    return false
  }
}

function readEscapeViewed(businessId: string): boolean {
  try {
    return localStorage.getItem(firstDayEscapeViewedStorageKey(businessId)) === "1"
  } catch {
    return false
  }
}

export function FirstDayChecklist({ model }: { model: FirstDayChecklistView }) {
  const [dismissed, setDismissed] = useState(true)
  const [escapeViewed, setEscapeViewed] = useState(false)

  useEffect(() => {
    queueMicrotask(() => {
      setDismissed(readDismissed(model.businessId))
      setEscapeViewed(readEscapeViewed(model.businessId))
    })
  }, [model.businessId])

  const items = useMemo(() => {
    return model.items.map((item) =>
      item.id === "escape" ? { ...item, done: item.done || escapeViewed } : item
    )
  }, [model.items, escapeViewed])

  const completedCount = items.filter((i) => i.done).length
  const totalCount = items.length
  const allComplete = items.every((i) => i.optional || i.done)

  useEffect(() => {
    if (typeof window === "undefined" || dismissed) return
    const el = document.getElementById("first-day-escape")
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          markEscapeViewed()
        }
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [dismissed, model.businessId])

  function dismiss() {
    try {
      localStorage.setItem(firstDayChecklistDismissStorageKey(model.businessId), "1")
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  function markEscapeViewed() {
    try {
      localStorage.setItem(firstDayEscapeViewedStorageKey(model.businessId), "1")
    } catch {
      /* ignore */
    }
    setEscapeViewed(true)
  }

  if (dismissed) return null

  const pct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_0_rgba(15,23,42,0.04)]"
      aria-labelledby="first-day-checklist-heading"
    >
      <div className="relative border-b border-border/40 px-5 py-5 sm:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 text-muted-foreground hover:text-foreground sm:right-3 sm:top-3"
          onClick={dismiss}
          aria-label={model.dismissLabel}
        >
          <X className="size-4" />
        </Button>
        <p className="pr-10 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {model.title}
        </p>
        <h2
          id="first-day-checklist-heading"
          className="mt-2 pr-8 text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          {allComplete ? "You are set for day one" : "Get value in about 15 minutes"}
        </h2>
        <p className="mt-2 max-w-2xl pr-6 text-sm leading-relaxed text-muted-foreground">
          {allComplete ? model.completionMessage : model.subtitle}
        </p>

        <div className="mt-4 pr-6">
          <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
            <span>
              {completedCount} of {totalCount} complete
            </span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted/60">
            <div
              className="h-full rounded-full bg-emerald-600 transition-[width] duration-300 dark:bg-emerald-500"
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-label="First-day checklist progress"
            />
          </div>
        </div>
      </div>

      {!allComplete ? (
        <ol className="divide-y divide-border/40 p-0">
          {items.map((item, index) => (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={() => {
                  if (item.id === "escape") markEscapeViewed()
                }}
                className={cn(
                  "flex gap-3 px-5 py-4 transition-colors hover:bg-muted/25 sm:px-6",
                  item.done && "bg-muted/10"
                )}
              >
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center">
                  {item.done ? (
                    <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-800 dark:text-emerald-200">
                      <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                    </span>
                  ) : (
                    <span className="flex size-6 items-center justify-center rounded-full border border-border/80 text-muted-foreground">
                      <Circle className="size-3 opacity-40" aria-hidden />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        item.done ? "text-muted-foreground line-through decoration-border" : "text-foreground"
                      )}
                    >
                      {index + 1}. {item.label}
                    </span>
                    {item.optional ? (
                      <span className="rounded border border-border/60 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Optional
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{item.detail}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="px-5 py-5 sm:px-6">
          <p className="flex items-start gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-100">
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
            {model.completionMessage}
          </p>
          {model.escapeScore != null ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Escape Readiness Score:{" "}
              <span className="font-semibold tabular-nums text-foreground">{model.escapeScore}%</span>
            </p>
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border/40 px-5 py-3 sm:px-6">
        <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
          {model.dismissLabel}
        </Button>
        {!allComplete && !escapeViewed ? (
          <Link
            href="#first-day-escape"
            onClick={markEscapeViewed}
            className="inline-flex h-8 items-center rounded-md border border-border/80 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted/40"
          >
            View Escape Readiness
          </Link>
        ) : null}
      </div>
    </section>
  )
}
