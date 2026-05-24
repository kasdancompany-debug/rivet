import type { IssueCostEstimate } from "@/lib/issues/cost-estimate/compute-cost-estimate"
import { formatCostUsd } from "@/lib/issues/cost-estimate/format-cost"
import { COST_LEVEL_STYLES } from "@/lib/issues/cost-estimate/cost-levels"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

export function IssueCostEstimateBadge({
  estimate,
  className,
}: {
  estimate: IssueCostEstimate
  className?: string
}) {
  const styles = COST_LEVEL_STYLES[estimate.level]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold tabular-nums",
        styles.badge,
        className
      )}
      title={COPY.issues.costEstimateHint}
    >
      <span className="uppercase tracking-wide opacity-80">{COPY.issues.costEstimateMonthlyShort}</span>
      <span>{formatCostUsd(estimate.monthlyProjectionUsd, { compact: true })}/mo</span>
    </span>
  )
}
