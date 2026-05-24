"use client"

import { Eye, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatAutosaveRelativeTime } from "@/lib/format-autosave-relative-time"
import { PUBLISH_IMPACT_LINES } from "@/lib/sops/publish-impact"
import { cn } from "@/lib/utils"

export function CaptureFormActionBar({
  lastSavedAt,
  autosaveSaving,
  showImpact,
  autosaveTick,
  pending,
  uploadInFlight,
  onPreview,
  onPublish,
}: {
  lastSavedAt: number | null
  autosaveSaving: boolean
  showImpact: boolean
  /** Bumped every second so relative save time stays fresh. */
  autosaveTick: number
  pending: boolean
  uploadInFlight: boolean
  onPreview: () => void
  onPublish: () => void
}) {
  void autosaveTick

  const autosaveLabel = autosaveSaving
    ? "Saving…"
    : lastSavedAt
      ? formatAutosaveRelativeTime(lastSavedAt)
      : null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.12)] backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto max-w-lg px-3 py-3 sm:max-w-xl sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            {autosaveLabel ? (
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {autosaveLabel}
              </p>
            ) : null}
            {showImpact ? (
              <div className="space-y-1">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Estimated impact
                </p>
                <ul className="space-y-0.5 text-sm text-foreground">
                  {PUBLISH_IMPACT_LINES.map((line) => (
                    <li key={line} className="flex items-center gap-1.5">
                      <span className="text-emerald-600 dark:text-emerald-400" aria-hidden>
                        ↓
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 min-w-[8.5rem] flex-1 sm:flex-none"
              disabled={pending || uploadInFlight || autosaveSaving}
              onClick={onPreview}
            >
              {pending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : (
                <Eye className="mr-2 size-4" aria-hidden />
              )}
              Preview Play
            </Button>
            <Button
              type="button"
              className={cn("h-12 min-w-[7.5rem] flex-1 sm:flex-none sm:px-8")}
              disabled={pending || uploadInFlight || autosaveSaving}
              onClick={onPublish}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Publish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
