"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronRight, Wrench } from "lucide-react"

import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<RouteFetchLine["status"], string> = {
  ok: "text-emerald-700 dark:text-emerald-300/90",
  empty: "text-amber-800 dark:text-amber-200/90",
  error: "text-rose-800 dark:text-rose-200/90",
  degraded: "text-amber-900 dark:text-amber-200/80",
  skipped: "text-muted-foreground",
}

export function RouteReliabilityDebug({
  routePath,
  fetchLines,
}: {
  routePath: string
  fetchLines: RouteFetchLine[]
}) {
  const [open, setOpen] = useState(true)

  const body = useMemo(() => {
    if (fetchLines.length === 0) {
      return (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          No fetch lines registered for this route. Pass <code className="rounded bg-muted px-1 py-0.5">fetchLines</code>{" "}
          from the server page into <code className="rounded bg-muted px-1 py-0.5">DashboardRouteShell</code> to record
          status per query.
        </p>
      )
    }
    return (
      <ul className="space-y-2.5">
        {fetchLines.map((line) => (
          <li key={line.label} className="space-y-1 border-b border-border/40 pb-2 last:border-0 last:pb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
              <span className="text-[11px] font-medium text-foreground">{line.label}</span>
              <span className={cn("font-mono text-[10px] font-semibold uppercase tracking-wide", STATUS_STYLES[line.status])}>
                {line.status}
              </span>
            </div>
            {line.detail ? <p className="text-[10px] leading-snug text-muted-foreground">{line.detail}</p> : null}
            {line.missing && line.missing.length > 0 ? (
              <p className="text-[10px] text-muted-foreground">
                <span className="font-medium text-foreground/80">Missing: </span>
                {line.missing.join(", ")}
              </p>
            ) : null}
            {line.suggestedFix ? (
              <p className="text-[10px] leading-snug text-sky-900/90 dark:text-sky-200/85">
                <span className="font-semibold">Fix: </span>
                {line.suggestedFix}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    )
  }, [fetchLines])

  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <div
      className="pointer-events-auto fixed bottom-3 left-3 z-[100] w-[min(100vw-1.5rem,22rem)] rounded-lg border border-amber-500/35 bg-card/95 p-3 text-left shadow-lg print:hidden backdrop-blur-sm dark:bg-card/90"
      data-testid="route-reliability-debug"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Wrench className="size-3.5 shrink-0 text-amber-700 dark:text-amber-300/90" aria-hidden />
          <p className="truncate font-mono text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Route debug
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-7 shrink-0"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          <span className="sr-only">{open ? "Collapse" : "Expand"}</span>
        </Button>
      </div>
      <p className="mt-1 truncate font-mono text-[11px] text-foreground" title={routePath}>
        {routePath}
      </p>
      {open ? <div className="mt-2 max-h-[40vh] overflow-y-auto pr-0.5">{body}</div> : null}
    </div>
  )
}
