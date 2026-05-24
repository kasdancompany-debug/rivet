import type { SopPlayCompletion } from "@/lib/sops/sop-play-completion"
import { cn } from "@/lib/utils"

function completionBarColor(percent: number): string {
  if (percent >= 75) return "bg-emerald-600/75 dark:bg-emerald-500/70"
  if (percent >= 40) return "bg-amber-500/80 dark:bg-amber-400/70"
  return "bg-rose-600/75 dark:bg-rose-500/70"
}

function ThinCompletionBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-medium tabular-nums text-foreground">{value}%</span>
      </div>
      <div
        className="h-1 overflow-hidden rounded-full bg-muted/80"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${value}%`}
      >
        <div
          className={cn("h-full rounded-full transition-[width]", completionBarColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export function SopPlayCompletionBlock({ completion }: { completion: SopPlayCompletion }) {
  return (
    <div className="space-y-2.5 border-t border-border/40 pt-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">
          Play Completion
        </p>
        <p className="text-sm font-semibold tabular-nums text-foreground">{completion.overall}%</p>
      </div>

      <div className="space-y-2">
        <ThinCompletionBar label="Documentation" value={completion.documentation} />
        <ThinCompletionBar label="Training" value={completion.training} />
        <ThinCompletionBar label="Ownership" value={completion.ownership} />
      </div>
    </div>
  )
}
