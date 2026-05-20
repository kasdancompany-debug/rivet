import type { RivetIndexBand, RivetIndexView } from "@/lib/rivet-score/types"
import { DependencyHeatmap } from "@/components/operational/dependency-heatmap"
import { OpeningChecklistPreview } from "@/components/operational/opening-checklist-preview"
import {
  OperationalCountersStrip,
  type OperationalCountersStripProps,
} from "@/components/operational/operational-counters-strip"
import { QualityAuditPreview } from "@/components/operational/quality-audit-preview"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

function bandPresentation(band: RivetIndexBand | null) {
  if (band == null) {
    return {
      label: "Not scored",
      className: "border-border/60 bg-muted/40 text-muted-foreground",
    }
  }
  switch (band) {
    case "critical":
      return {
        label: "Critical",
        className:
          "border-rose-200/70 bg-rose-500/[0.05] text-rose-900 dark:border-rose-500/25 dark:bg-rose-500/[0.06] dark:text-rose-100",
      }
    case "fragile":
      return {
        label: "Fragile",
        className:
          "border-amber-200/70 bg-amber-500/[0.05] text-amber-950 dark:border-amber-500/25 dark:bg-amber-500/[0.06] dark:text-amber-50",
      }
    case "improving":
      return {
        label: "Improving",
        className:
          "border-sky-200/70 bg-sky-500/[0.05] text-sky-950 dark:border-sky-500/25 dark:bg-sky-500/[0.06] dark:text-sky-50",
      }
    case "stable":
      return {
        label: "Stable",
        className: "border-border/60 bg-muted/40 text-foreground",
      }
    default:
      return {
        label: "Transferable",
        className:
          "border-emerald-200/70 bg-emerald-500/[0.05] text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-500/[0.06] dark:text-emerald-50",
      }
  }
}

export function RivetIndexPanel({
  model,
  operational,
}: {
  model: RivetIndexView
  operational: OperationalCountersStripProps
}) {
  const overall = bandPresentation(model.overallBand)
  const trend = model.trend
    .slice(-21)
    .filter((p) => p.autonomyScore != null && Number.isFinite(p.autonomyScore))

  return (
    <section
      className="rivet-panel relative overflow-hidden rounded-xl px-6 py-9 sm:px-10 sm:py-10 lg:px-11 lg:py-11"
      aria-labelledby="rivet-index-heading"
    >
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
        <div className="min-w-0 max-w-2xl space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <p
              id="rivet-index-heading"
              className="rivet-section-label"
            >
              Rivet Index
            </p>
            <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[0.65rem]", overall.className)}>
              {overall.label}
            </Badge>
          </div>
          <h2 className="text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
            {model.headlineQuestion}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] sm:leading-[1.6]">
            {model.headlineAnswer}
          </p>
          <div className="flex flex-wrap items-end gap-6 pt-1">
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Likelihood without owner
              </p>
              <p className="mt-1.5 text-5xl font-semibold tabular-nums tracking-tight text-foreground sm:text-6xl">
                {model.autonomyLikelihood == null ? "—" : model.autonomyLikelihood}
                {model.autonomyLikelihood != null ? (
                  <span className="text-xl font-medium text-muted-foreground sm:text-2xl">%</span>
                ) : null}
              </p>
            </div>
            <div className="border-l border-border/60 pl-6">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Owner dependency
              </p>
              <p className="mt-1.5 text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                {model.dependencyScore == null ? "—" : `${model.dependencyScore} / 100`}
              </p>
              <p className="mt-1 max-w-[14rem] text-xs leading-relaxed text-muted-foreground">
                Higher means more load still routes through you—lower is the direction of structural continuity.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 space-y-3 lg:max-w-sm">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Autonomy trend (UTC days)
          </p>
          <div className="flex h-24 items-end gap-px rounded-lg border border-border/50 bg-muted/20 px-2 pb-2 pt-3">
            {trend.length === 0 ? (
              <p className="w-full px-2 text-center text-xs text-muted-foreground">No history yet.</p>
            ) : (
              trend.map((p) => {
                const a = p.autonomyScore as number
                const h = Math.max(4, Math.round((a / 100) * 72))
                return (
                  <div
                    key={p.date}
                    className="group flex min-w-0 flex-1 flex-col justify-end"
                    title={`${p.date}: autonomy ${a}%`}
                  >
                    <div
                      className="mx-auto w-full max-w-[10px] rounded-sm bg-foreground/55 transition-[height] group-hover:bg-foreground/75"
                      style={{ height: `${h}px` }}
                    />
                  </div>
                )
              })
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Bars show the stored autonomy read per day. Today uses the live calculation; earlier points come from
            nightly snapshots when the database migration is applied.
          </p>
        </div>
      </div>

      <OperationalCountersStrip
        unresolvedBottlenecks={operational.unresolvedBottlenecks}
        ownerInterruptionsThisWeek={operational.ownerInterruptionsThisWeek}
        ownerTasksOpen={operational.ownerTasksOpen}
        trainingProgressPercent={operational.trainingProgressPercent}
        standardsDepthPercent={operational.standardsDepthPercent}
        standardsGap={operational.standardsGap}
        className="mt-8"
      />

      <div className="mt-8">
        <DependencyHeatmap categories={model.categories} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <OpeningChecklistPreview variant="compact" />
        <QualityAuditPreview />
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {model.categories.map((c) => {
          const b = bandPresentation(c.band)
          return (
            <Card key={c.id} variant="quiet" className="bg-card/80">
              <CardHeader className="space-y-2 pb-2 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold leading-tight">{c.label}</CardTitle>
                  <Badge variant="outline" className={cn("shrink-0 text-[0.6rem]", b.className)}>
                    {b.label}
                  </Badge>
                </div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">
                  {c.dependencyScore == null ? "—" : `${c.dependencyScore} / 100`}
                </p>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <CardDescription className="text-xs leading-relaxed">{c.hint}</CardDescription>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {model.criticalWarnings.length > 0 ? (
        <div className="mt-10 rounded-lg border border-border/50 border-l-[3px] border-l-amber-500/40 bg-muted/15 px-5 py-5 sm:px-6 dark:bg-muted/10">
          <p className="rivet-section-label text-amber-950 dark:text-amber-200/90">
            Critical dependency warnings
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/90">
            {model.criticalWarnings.map((w) => (
              <li key={w} className="flex gap-2">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/25" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
