import { DollarSign, TrendingDown, User, Users, Wallet } from "lucide-react"

import type { IssueCostEstimate } from "@/lib/issues/cost-estimate/compute-cost-estimate"
import { formatCostUsd } from "@/lib/issues/cost-estimate/format-cost"
import { COST_LEVEL_STYLES, labelForCostLevel } from "@/lib/issues/cost-estimate/cost-levels"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"
import type { IssueStatus } from "@/types/database"

function CostLine({
  icon: Icon,
  label,
  amount,
  detail,
  barWidth,
  barClass,
}: {
  icon: typeof DollarSign
  label: string
  amount: number
  detail: string
  barWidth: number
  barClass: string
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border/50 bg-background/80 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground">{label}</p>
            <p className="text-[0.68rem] leading-snug text-muted-foreground">{detail}</p>
          </div>
        </div>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {formatCostUsd(amount)}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
        <div className={cn("h-full rounded-full transition-all", barClass)} style={{ width: `${barWidth}%` }} />
      </div>
    </div>
  )
}

export function IssueCostEstimatePanel({
  estimate,
  status,
  prominent = false,
}: {
  estimate: IssueCostEstimate
  status: IssueStatus
  prominent?: boolean
}) {
  const styles = COST_LEVEL_STYLES[estimate.level]
  const total = Math.max(
    1,
    estimate.laborImpactUsd + estimate.lostSalesUsd + estimate.ownerTimeUsd
  )
  const laborPct = Math.round((estimate.laborImpactUsd / total) * 100)
  const salesPct = Math.round((estimate.lostSalesUsd / total) * 100)
  const ownerPct = Math.round((estimate.ownerTimeUsd / total) * 100)

  const incidents = estimate.drivers.incidentsPerMonth
  const incidentLabel =
    incidents === 1
      ? COPY.issues.costEstimateIncidentsOnce
      : COPY.issues.costEstimateIncidentsRepeat(incidents)

  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border-2",
        prominent ? styles.headline : "border-border/50 bg-muted/15"
      )}
    >
      <div className={cn("px-4 py-5 sm:px-6 sm:py-6", prominent && "space-y-5")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-muted-foreground" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {COPY.issues.costEstimateTitle}
              </p>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {COPY.issues.costEstimateHint}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
              {COPY.issues.costEstimateMonthlyLabel}
            </p>
            <p
              className={cn(
                "mt-0.5 text-3xl font-bold tabular-nums tracking-tight sm:text-4xl",
                estimate.level === "severe" || estimate.level === "high"
                  ? "text-rose-700 dark:text-rose-300"
                  : "text-foreground"
              )}
            >
              {formatCostUsd(estimate.monthlyProjectionUsd)}
            </p>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold uppercase",
                styles.badge
              )}
            >
              {labelForCostLevel(estimate.level)}
            </span>
          </div>
        </div>

        {status === "resolved" ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingDown className="size-3.5 shrink-0" aria-hidden />
            {COPY.issues.costEstimateResolvedNote}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">{incidentLabel}</p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <CostLine
            icon={Users}
            label={COPY.issues.costEstimateLabor}
            amount={estimate.laborImpactUsd}
            detail={COPY.issues.costEstimateLaborDetail(
              estimate.drivers.laborMinutesPerIncident,
              estimate.drivers.teamHourlyUsd
            )}
            barWidth={laborPct}
            barClass={styles.bar}
          />
          <CostLine
            icon={DollarSign}
            label={COPY.issues.costEstimateLostSales}
            amount={estimate.lostSalesUsd}
            detail={COPY.issues.costEstimateLostSalesDetail}
            barWidth={salesPct}
            barClass={styles.bar}
          />
          <CostLine
            icon={User}
            label={COPY.issues.costEstimateOwnerTime}
            amount={estimate.ownerTimeUsd}
            detail={COPY.issues.costEstimateOwnerDetail(
              estimate.drivers.ownerMinutesPerIncident,
              estimate.drivers.ownerHourlyUsd
            )}
            barWidth={ownerPct}
            barClass={styles.bar}
          />
        </div>

        <p className="text-[0.65rem] leading-relaxed text-muted-foreground">{COPY.issues.costEstimateDisclaimer}</p>
      </div>
    </section>
  )
}
