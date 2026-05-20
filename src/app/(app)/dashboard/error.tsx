"use client"

import Link from "next/link"
import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[rivet] dashboard error", error)
    }
  }, [error])

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-16 sm:px-6">
      <div className="flex gap-3 rounded-lg border border-border/60 border-l-[3px] border-l-amber-500/50 bg-muted/20 px-4 py-4 dark:bg-muted/10">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400/90" aria-hidden />
        <div className="min-w-0 space-y-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{COPY.dashboard.loadErrorTitle}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{COPY.dashboard.loadErrorBody}</p>
          {process.env.NODE_ENV !== "production" && error.message ? (
            <p className="break-words font-mono text-[11px] text-muted-foreground">{error.message}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => reset()}>
          {COPY.routeRecovery.tryAgain}
        </Button>
        <Button type="button" variant="outline" nativeButton={false} render={<Link href="/dashboard" />}>
          {COPY.routeRecovery.backOverview}
        </Button>
      </div>
    </div>
  )
}
