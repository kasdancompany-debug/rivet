"use client"

import Link from "next/link"
import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

import { COPY } from "@/lib/interface-copy"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function AppSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[rivet] app segment error", error)
    }
  }, [error])

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-16 pt-6">
      <div className="flex gap-3 rounded-lg border border-border/60 border-l-[3px] border-l-amber-500/50 bg-muted/20 px-4 py-4 dark:bg-muted/10">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400/90" aria-hidden />
        <div className="min-w-0 space-y-2">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">{COPY.routeRecovery.segmentErrorTitle}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{COPY.routeRecovery.segmentErrorBody}</p>
          {process.env.NODE_ENV !== "production" && error.message ? (
            <p className="break-words font-mono text-[11px] text-muted-foreground">{error.message}</p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" onClick={() => reset()}>
          {COPY.routeRecovery.tryAgain}
        </Button>
        <Button nativeButton={false} variant="outline" render={<Link href="/settings" />}>
          {COPY.routeRecovery.openSettings}
        </Button>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "inline-flex h-10 items-center justify-center px-4")}>
          {COPY.routeRecovery.backOverview}
        </Link>
      </div>
    </div>
  )
}
