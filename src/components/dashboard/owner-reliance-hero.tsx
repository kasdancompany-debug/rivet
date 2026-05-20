import type { RivetIndexBand } from "@/lib/rivet-score/types"
import type { DashboardViewModel } from "@/lib/dashboard/types"
import { COPY } from "@/lib/interface-copy"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const BANDS = COPY.hero.bands

function bandShell(band: RivetIndexBand | null): { label: string; bar: string; badge: string; tone: string } {
  if (band == null) {
    return {
      label: COPY.hero.notScoredBadge,
      bar: "bg-zinc-400 dark:bg-zinc-500",
      badge: "border-border/70 bg-muted/50 text-muted-foreground dark:border-border/60 dark:bg-muted/30",
      tone: "text-muted-foreground",
    }
  }
  switch (band) {
    case "critical":
      return {
        label: BANDS.critical,
        bar: "bg-rose-600 dark:bg-rose-500",
        badge:
          "border-rose-200/80 bg-rose-500/[0.06] text-rose-900 dark:border-rose-500/25 dark:bg-rose-500/[0.08] dark:text-rose-100",
        tone: "text-rose-950 dark:text-rose-50",
      }
    case "fragile":
      return {
        label: BANDS.fragile,
        bar: "bg-amber-500 dark:bg-amber-400",
        badge:
          "border-amber-200/80 bg-amber-500/[0.06] text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/[0.08] dark:text-amber-50",
        tone: "text-amber-950 dark:text-amber-50",
      }
    case "improving":
      return {
        label: BANDS.improving,
        bar: "bg-sky-600 dark:bg-sky-500",
        badge:
          "border-sky-200/80 bg-sky-500/[0.06] text-sky-950 dark:border-sky-500/25 dark:bg-sky-500/[0.08] dark:text-sky-50",
        tone: "text-sky-950 dark:text-sky-50",
      }
    case "stable":
      return {
        label: BANDS.stable,
        bar: "bg-zinc-400 dark:bg-zinc-500",
        badge: "border-border/70 bg-muted/50 text-foreground dark:border-border/60 dark:bg-muted/30",
        tone: "text-foreground",
      }
    default:
      return {
        label: BANDS.transferable,
        bar: "bg-emerald-600 dark:bg-emerald-500",
        badge:
          "border-emerald-200/80 bg-emerald-500/[0.06] text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-500/[0.08] dark:text-emerald-50",
        tone: "text-emerald-950 dark:text-emerald-50",
      }
  }
}

export function OwnerRelianceHero({ model }: { model: DashboardViewModel }) {
  const rivet = model.rivetIndex
  const shell = bandShell(rivet.overallBand)
  const week = rivet.trend
    .slice(-7)
    .filter((p) => p.autonomyScore != null && Number.isFinite(p.autonomyScore))

  return (
    <section
      className={cn("relative overflow-hidden rounded-2xl rivet-panel")}
      aria-labelledby="owner-reliance-heading"
    >
      <div className={cn("absolute left-0 top-0 h-full w-1 sm:w-1.5", shell.bar)} aria-hidden />
      <div className="px-5 py-7 pl-6 sm:px-8 sm:py-8 sm:pl-9 lg:flex lg:items-stretch lg:justify-between lg:gap-12">
        <div className="min-w-0 flex-1 space-y-5">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <p id="owner-reliance-heading" className="rivet-section-label">
              {COPY.hero.eyebrow}
            </p>
            <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold", shell.badge)}>
              {shell.label}
            </Badge>
            {model.businessName ? (
              <span className="text-[0.65rem] font-medium text-muted-foreground sm:text-xs">{model.businessName}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-end gap-6 gap-y-2">
            <div>
              <p
                className={cn(
                  "text-[clamp(3.5rem,10vw,5.5rem)] font-semibold leading-none tabular-nums tracking-tight",
                  shell.tone
                )}
              >
                {rivet.dependencyScore == null ? (
                  <span className="text-muted-foreground">{COPY.hero.rivetEmptyPrimary}</span>
                ) : (
                  <>
                    {rivet.dependencyScore}
                    <span className="text-[clamp(1.25rem,4vw,2rem)] font-semibold text-muted-foreground">%</span>
                  </>
                )}
              </p>
              <p className="mt-2 text-xs font-medium text-muted-foreground sm:text-sm">
                {rivet.dependencyScore == null ? COPY.hero.rivetEmptySub : COPY.hero.relianceSub}
              </p>
            </div>
            <div className="border-l border-border/50 pl-6">
              <p className="rivet-section-label">{COPY.hero.autonomyLabel}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                {rivet.autonomyLikelihood == null ? (
                  <span className="text-muted-foreground">{COPY.hero.rivetEmptyPrimary}</span>
                ) : (
                  <>
                    {rivet.autonomyLikelihood}
                    <span className="text-base font-medium text-muted-foreground sm:text-lg">%</span>
                  </>
                )}
              </p>
            </div>
            <div className="border-l border-border/50 pl-6">
              <p className="rivet-section-label">{COPY.hero.weekLabel}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">{model.ownerInterruptionsThisWeekCount}</p>
              <p className="text-[0.65rem] text-muted-foreground">{COPY.hero.weekHint}</p>
              {model.ownerInterruptionsThisWeekMinutes > 0 ? (
                <p className="mt-1 text-[0.65rem] font-medium text-muted-foreground">
                  {COPY.hero.weekHoursLeak(Math.round((model.ownerInterruptionsThisWeekMinutes / 60) * 10) / 10)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2 border-t border-border/40 pt-5">
            <p className="text-[15px] font-semibold leading-snug text-foreground sm:text-base">{COPY.hero.verdictQuestion}</p>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{rivet.headlineAnswer}</p>
          </div>
        </div>

        <div className="mt-8 flex shrink-0 flex-col justify-end border-t border-border/40 pt-6 lg:mt-0 lg:w-[min(100%,15rem)] lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="rivet-section-label">{COPY.hero.trendLabel}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{COPY.hero.trendHint}</p>
          <div className="mt-4 flex h-[5.25rem] items-end gap-px">
            {week.length === 0 ? (
              <span className="text-xs text-muted-foreground">{COPY.hero.trendEmpty}</span>
            ) : (
              week.map((p) => {
                const a = p.autonomyScore as number
                const h = Math.max(6, Math.round((a / 100) * 72))
                return (
                  <div key={p.date} className="group flex min-w-0 flex-1 flex-col justify-end" title={`${p.date}: ${a}%`}>
                    <div
                      className="mx-auto w-full max-w-[10px] rounded-[2px] bg-foreground/35 transition-colors group-hover:bg-foreground/50"
                      style={{ height: `${h}px` }}
                    />
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
