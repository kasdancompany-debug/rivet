import type { IssuePainScoreResult } from "@/lib/issues/pain-score/compute-pain-score"
import { PAIN_LEVEL_STYLES } from "@/lib/issues/pain-score/pain-levels"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

export function IssuePainScoreBadge({
  pain,
  className,
  showLabel = false,
}: {
  pain: IssuePainScoreResult
  className?: string
  showLabel?: boolean
}) {
  const styles = PAIN_LEVEL_STYLES[pain.level]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums tracking-wide",
        styles.badge,
        className
      )}
      title={COPY.issues.painScoreHint}
    >
      <span className={cn("size-1.5 rounded-full", styles.dot)} aria-hidden />
      {showLabel ? <span className="uppercase">{COPY.issues.painScoreLabel}</span> : null}
      <span>{pain.painScore}</span>
    </span>
  )
}
