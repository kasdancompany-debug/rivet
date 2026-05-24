import type { IssuePainScoreResult } from "@/lib/issues/pain-score/compute-pain-score"
import { PAIN_LEVEL_STYLES, labelForPainLevel } from "@/lib/issues/pain-score/pain-levels"
import { formatIssueSeverity } from "@/lib/issues/constants"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

function DriverRow({
  label,
  score,
  detail,
  level,
}: {
  label: string
  score: number
  detail: string
  level: IssuePainScoreResult["level"]
}) {
  const bar = PAIN_LEVEL_STYLES[level].bar

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">{score}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
        <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${score}%` }} />
      </div>
      <p className="text-[0.68rem] leading-snug text-muted-foreground">{detail}</p>
    </div>
  )
}

export function IssuePainScorePanel({ pain }: { pain: IssuePainScoreResult }) {
  const styles = PAIN_LEVEL_STYLES[pain.level]

  return (
    <div className="rounded-xl border border-border/50 bg-muted/15 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {COPY.issues.painScoreLabel}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{COPY.issues.painScoreHint}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex min-w-[3rem] items-center justify-center rounded-lg border px-2.5 py-1 text-lg font-semibold tabular-nums",
              styles.badge
            )}
          >
            {pain.painScore}
          </span>
          <span className={cn("rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase", styles.badge)}>
            {labelForPainLevel(pain.level)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <DriverRow
          label={COPY.issues.painScoreDriverFrequency}
          score={pain.drivers.frequency.score}
          detail={
            pain.drivers.frequency.count === 1
              ? COPY.issues.painScoreFrequencyOnce
              : COPY.issues.painScoreFrequencyRepeat(pain.drivers.frequency.count)
          }
          level={pain.level}
        />
        <DriverRow
          label={COPY.issues.painScoreDriverTimeCost}
          score={pain.drivers.timeCost.score}
          detail={COPY.issues.painScoreTimeCostDetail(formatIssueSeverity(pain.drivers.timeCost.severity))}
          level={pain.level}
        />
        <DriverRow
          label={COPY.issues.painScoreDriverOwner}
          score={pain.drivers.ownerInvolvement.score}
          detail={
            pain.drivers.ownerInvolvement.ownerRequired
              ? COPY.issues.painScoreOwnerRequired
              : COPY.issues.painScoreOwnerOptional
          }
          level={pain.level}
        />
        <DriverRow
          label={COPY.issues.painScoreDriverRecency}
          score={pain.drivers.recency.score}
          detail={COPY.issues.painScoreRecencyDetail(pain.drivers.recency.daysSinceCreated)}
          level={pain.level}
        />
      </div>
    </div>
  )
}
