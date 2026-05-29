import type { CapabilityReadiness } from "@/lib/training/build-views"
import {
  READINESS_LEVEL_LABELS,
  readinessLevelBand,
} from "@/lib/training/compute-readiness"
import {
  effectiveReadinessLabel,
  readinessLevelBandClass,
} from "@/lib/training/readiness/presentation"
import { ReadinessPctRing } from "@/components/training/readiness-pct-ring"
import { cn } from "@/lib/utils"

export function ReadinessCapabilityCard({
  capability,
  compact = false,
}: {
  capability: CapabilityReadiness
  compact?: boolean
}) {
  const band = readinessLevelBand(capability.score)
  const statusLabel = effectiveReadinessLabel(capability.score, capability.effective)

  return (
    <article
      className={cn(
        "flex gap-3 rounded-2xl border p-4",
        readinessLevelBandClass(band),
        compact && "p-3"
      )}
    >
      <ReadinessPctRing score={capability.score} size={compact ? "sm" : "md"} />
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold leading-snug tracking-tight">{capability.displayLabel}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {READINESS_LEVEL_LABELS[band]}
          {capability.overridden ? " · Manager confirmed" : null}
        </p>
        <p
          className={cn(
            "mt-2 text-[0.65rem] font-medium uppercase tracking-[0.12em]",
            capability.effective === "ready"
              ? "text-emerald-800 dark:text-emerald-200"
              : "text-muted-foreground"
          )}
        >
          {statusLabel}
        </p>
      </div>
    </article>
  )
}
