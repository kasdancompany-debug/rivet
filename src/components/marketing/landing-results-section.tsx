import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react"

import { LANDING_RESULTS } from "@/lib/marketing-landing-copy"
import { cn } from "@/lib/utils"

type LandingResultMetric = (typeof LANDING_RESULTS.metrics)[number]

function formatMetricValue(metric: LandingResultMetric, side: "before" | "after"): string {
  const raw = side === "before" ? metric.before : metric.after
  switch (metric.unit) {
    case "count":
      return String(raw as number)
    case "hours":
      return `${raw as number} hrs`
    case "fraction": {
      const f = raw as { of: number; total: number }
      return `${f.of} of ${f.total}`
    }
    case "percent":
      return `${raw as number}%`
    default:
      return String(raw)
  }
}

function MetricRow({
  metric,
  variant,
}: {
  metric: (typeof LANDING_RESULTS.metrics)[number]
  variant: "before" | "after"
}) {
  const isAfter = variant === "after"
  const display = formatMetricValue(metric, variant)

  return (
    <div
      className={cn(
        "flex items-end justify-between gap-3 border-t border-zinc-200/80 py-3.5 first:border-t-0 first:pt-0 dark:border-zinc-800/80",
        isAfter && "border-zinc-200/60 dark:border-zinc-800/60"
      )}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-medium leading-snug text-zinc-600 dark:text-zinc-400">{metric.label}</p>
        {metric.hint ? (
          <p className="mt-0.5 text-[10px] leading-snug text-zinc-500 dark:text-zinc-500">{metric.hint}</p>
        ) : null}
      </div>
      <p
        className={cn(
          "shrink-0 text-right text-xl font-semibold tabular-nums tracking-tight sm:text-2xl",
          isAfter ? "text-zinc-950 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
        )}
      >
        {display}
      </p>
    </div>
  )
}

export function LandingResultsSection() {
  const { eyebrow, title, lead, scenario, beforeCard, afterCard, metrics, disclaimer } = LANDING_RESULTS

  return (
    <section
      className="border-b border-zinc-200 bg-zinc-50 py-14 sm:py-16 dark:border-zinc-800 dark:bg-zinc-900/25"
      aria-labelledby="results-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{eyebrow}</p>
        <h2
          id="results-heading"
          className="mt-3 max-w-[28ch] text-2xl font-semibold leading-[1.12] tracking-[-0.03em] text-zinc-950 sm:max-w-none sm:text-[1.75rem] dark:text-white"
        >
          {title}
        </h2>
        <p className="mt-4 max-w-[52ch] text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">{lead}</p>
        <p className="mt-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">{scenario}</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2 lg:gap-5">
          <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white ring-1 ring-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/[0.04]">
            <div className="border-b border-zinc-200 bg-zinc-100/80 px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/50 sm:px-6">
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {beforeCard.heading}
              </h3>
              <p className="mt-1.5 text-[13px] font-medium leading-snug text-zinc-800 dark:text-zinc-200">
                {beforeCard.snapshot}
              </p>
            </div>
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              {metrics.map((m) => (
                <MetricRow key={m.id} metric={m} variant="before" />
              ))}
            </div>
          </article>

          <article className="overflow-hidden rounded-lg border border-zinc-300 bg-white shadow-sm ring-1 ring-zinc-950/[0.05] dark:border-zinc-700 dark:bg-zinc-950 dark:ring-white/[0.06]">
            <div className="border-b border-zinc-200 bg-zinc-950 px-5 py-3.5 text-white dark:border-zinc-800 sm:px-6">
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                {afterCard.heading}
              </h3>
              <p className="mt-1.5 text-[13px] font-medium leading-snug text-zinc-100">{afterCard.snapshot}</p>
            </div>
            <div className="px-5 py-4 sm:px-6 sm:py-5">
              {metrics.map((m) => (
                <MetricRow key={m.id} metric={m} variant="after" />
              ))}
            </div>
          </article>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <p className="border-b border-zinc-200 px-4 py-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:border-zinc-800 sm:px-5">
            {LANDING_RESULTS.deltaHeading}
          </p>
          <ul className="grid divide-y divide-zinc-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 dark:divide-zinc-800">
            {metrics.map((m) => (
              <li key={m.id} className="flex flex-col gap-2 px-4 py-4 sm:px-5">
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">{m.label}</span>
                <span className="flex flex-wrap items-center gap-2 text-sm font-semibold tabular-nums text-zinc-950 dark:text-white">
                  <span className="text-zinc-400 line-through decoration-zinc-300 dark:text-zinc-500">
                    {formatMetricValue(m, "before")}
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
                  <span>{formatMetricValue(m, "after")}</span>
                  {m.deltaLabel ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                      {m.deltaDirection === "up" ? (
                        <ArrowUpRight className="size-3" aria-hidden />
                      ) : (
                        <ArrowDownRight className="size-3" aria-hidden />
                      )}
                      {m.deltaLabel}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-500">{disclaimer}</p>
      </div>
    </section>
  )
}
