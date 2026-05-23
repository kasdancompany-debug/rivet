import type { RivetIndexBand } from "@/lib/rivet-score/types"
import type { DashboardViewModel } from "@/lib/dashboard/types"
import { COPY } from "@/lib/interface-copy"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const BANDS = COPY.hero.bands

function bandLabel(band: RivetIndexBand | null): string {
  if (band == null) return COPY.hero.notScoredBadge
  switch (band) {
    case "critical":
      return BANDS.critical
    case "fragile":
      return BANDS.fragile
    case "improving":
      return BANDS.improving
    case "stable":
      return BANDS.stable
    default:
      return BANDS.transferable
  }
}

function bandBadgeClass(band: RivetIndexBand | null): string {
  if (band == null) {
    return "border-border/70 bg-muted/50 text-muted-foreground"
  }
  switch (band) {
    case "critical":
      return "border-rose-200/80 bg-rose-500/[0.06] text-rose-900 dark:border-rose-500/25 dark:bg-rose-500/[0.08] dark:text-rose-100"
    case "fragile":
      return "border-amber-200/80 bg-amber-500/[0.06] text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/[0.08] dark:text-amber-50"
    case "improving":
      return "border-sky-200/80 bg-sky-500/[0.06] text-sky-950 dark:border-sky-500/25 dark:bg-sky-500/[0.08] dark:text-sky-50"
    case "stable":
      return "border-border/70 bg-muted/50 text-foreground"
    default:
      return "border-emerald-200/80 bg-emerald-500/[0.06] text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-500/[0.08] dark:text-emerald-50"
  }
}

/** Short overview verdict — numbers live in At a glance tiles. */
export function OwnerRelianceHero({ model }: { model: DashboardViewModel }) {
  const rivet = model.rivetIndex
  const week = rivet.trend
    .slice(-7)
    .filter((p) => p.autonomyScore != null && Number.isFinite(p.autonomyScore))

  return (
    <section className="rivet-panel px-5 py-5 sm:px-6 sm:py-6" aria-labelledby="owner-reliance-heading">
      <div className="flex flex-wrap items-center gap-2">
        <p id="owner-reliance-heading" className="rivet-section-label">
          {COPY.hero.eyebrow}
        </p>
        <Badge
          variant="outline"
          className={cn("rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold", bandBadgeClass(rivet.overallBand))}
        >
          {bandLabel(rivet.overallBand)}
        </Badge>
        {model.businessName ? (
          <span className="text-xs font-medium text-muted-foreground">{model.businessName}</span>
        ) : null}
      </div>

      <p className="mt-4 text-[15px] font-semibold leading-snug text-foreground sm:text-base">{COPY.hero.verdictQuestion}</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{rivet.headlineAnswer}</p>

      {week.length > 0 ? (
        <div className="mt-6 border-t border-border/40 pt-5">
          <p className="rivet-section-label">{COPY.hero.trendLabel}</p>
          <p className="mt-1 text-xs text-muted-foreground">{COPY.hero.trendHint}</p>
          <div className="mt-3 flex h-14 items-end gap-px">
            {week.map((p) => {
              const a = p.autonomyScore as number
              const h = Math.max(6, Math.round((a / 100) * 56))
              return (
                <div
                  key={p.date}
                  className="group flex min-w-0 flex-1 flex-col justify-end"
                  title={`${p.date}: ${a}% escape readiness`}
                >
                  <div
                    className="mx-auto w-full max-w-[10px] rounded-[2px] bg-emerald-600/50 transition-colors group-hover:bg-emerald-600/70 dark:bg-emerald-500/45"
                    style={{ height: `${h}px` }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </section>
  )
}
