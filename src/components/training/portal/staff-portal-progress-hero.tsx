import { COPY } from "@/lib/interface-copy"
import type { PortalProgressSummary } from "@/lib/training/portal/load-portal-home"
import { cn } from "@/lib/utils"

export function StaffPortalProgressHero({ progress }: { progress: PortalProgressSummary }) {
  const pct = progress.overallPct

  return (
    <div className="rounded-3xl border border-border/40 bg-card p-5 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{COPY.staffPortal.progressLabel}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">{pct}%</p>
        <div className="pb-1 text-right text-xs text-muted-foreground">
          {progress.playsTotal > 0 ? (
            <p>
              {progress.playsCompleted}/{progress.playsTotal} {COPY.staffPortal.progressPlays}
            </p>
          ) : null}
          {progress.modulesTotal > 0 ? (
            <p className="mt-0.5">
              {progress.modulesCompleted}/{progress.modulesTotal} {COPY.staffPortal.progressModules}
            </p>
          ) : null}
          {progress.certificationsEarned > 0 ? (
            <p className="mt-0.5">
              {progress.certificationsEarned} {COPY.staffPortal.progressCerts}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            pct >= 100 ? "bg-emerald-500" : "bg-primary"
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
