"use client"

import { RefreshCw, X } from "lucide-react"

import type { OperationalUploadJob } from "@/lib/media/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function OperationalMediaUploadQueue({
  jobs,
  onDismiss,
  className,
}: {
  jobs: OperationalUploadJob[]
  onDismiss?: (jobId: string) => void
  className?: string
}) {
  if (jobs.length === 0) return null

  return (
    <ul
      className={cn(
        "space-y-2 rounded-2xl border border-border/50 bg-card/80 p-3 shadow-sm backdrop-blur-sm",
        className
      )}
      aria-live="polite"
      aria-label="Upload progress"
    >
      {jobs.map((job) => (
        <li key={job.id} className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 truncate text-sm font-medium text-foreground">{job.fileName}</span>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {job.phase === "preparing"
                  ? "Preparing…"
                  : job.phase === "uploading"
                    ? `${job.progress}%`
                    : job.phase === "finalizing"
                      ? "Saving…"
                      : "Failed"}
              </span>
              {onDismiss && job.phase === "error" ? (
                <button
                  type="button"
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => onDismiss(job.id)}
                  aria-label="Dismiss"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
          </div>
          {job.phase !== "error" ? (
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                style={{
                  width:
                    job.phase === "preparing"
                      ? "12%"
                      : job.phase === "finalizing"
                        ? "100%"
                        : `${Math.max(job.progress, 4)}%`,
                }}
              />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs text-destructive">{job.errorMessage ?? "Upload failed."}</p>
              {job.retry ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => job.retry?.()}
                >
                  <RefreshCw className="size-3" aria-hidden />
                  Retry
                </Button>
              ) : null}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
