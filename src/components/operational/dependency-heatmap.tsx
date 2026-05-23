import type { RivetCategoryScore } from "@/lib/rivet-score/types"
import { COPY } from "@/lib/interface-copy"
import { cn } from "@/lib/utils"

function cellStyle(score: number | null): string {
  if (score == null) {
    return "border border-dashed border-border/60 bg-muted/30 text-muted-foreground"
  }
  if (score >= 70) return "bg-rose-500/85 text-white dark:bg-rose-600/90"
  if (score >= 50) return "bg-amber-500/80 text-amber-950 dark:bg-amber-500/75 dark:text-amber-950"
  if (score >= 35) return "bg-foreground/25 text-foreground dark:bg-foreground/30"
  return "bg-emerald-500/75 text-emerald-950 dark:bg-emerald-600/70 dark:text-emerald-50"
}

export function DependencyHeatmap({ categories }: { categories: RivetCategoryScore[] }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/15 p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {COPY.heatmap.title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{COPY.heatmap.subtitle}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((c) => (
          <div
            key={c.id}
            className={cn(
              "flex min-h-[4.5rem] flex-col justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-opacity sm:min-h-[5rem]",
              cellStyle(c.dependencyScore)
            )}
            title={
              c.dependencyScore == null
                ? `${c.label}: ${COPY.dashboard.metricNoData}`
                : `${c.label}: ${c.dependencyScore}% on you`
            }
          >
            <span className="leading-snug opacity-95">{c.label}</span>
            <span className="mt-2 text-lg font-semibold tabular-nums">
              {c.dependencyScore == null ? "—" : c.dependencyScore}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
