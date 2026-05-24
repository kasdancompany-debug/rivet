import { ArrowRight } from "lucide-react";

import { LANDING_RESULTS } from "@/lib/marketing-landing-copy";
import { cn } from "@/lib/utils";

function ComparisonBar({
  value,
  maxValue,
  tone,
}: {
  value: number;
  maxValue: number;
  tone: "before" | "after";
}) {
  const width = Math.max(8, Math.round((value / maxValue) * 100));

  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          tone === "before" ? "bg-rose-500/80" : "bg-emerald-500/85",
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function LandingResultsSection() {
  const { eyebrow, title, comparison, estimated, disclaimer } = LANDING_RESULTS;
  const { before, after, maxValue } = comparison;

  return (
    <section
      className="border-b border-zinc-200 bg-zinc-50 py-6 sm:py-8 dark:border-zinc-800 dark:bg-zinc-900/25"
      aria-labelledby="results-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {eyebrow}
        </p>
        <h2
          id="results-heading"
          className="mt-3 text-xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-2xl dark:text-white"
        >
          {title}
        </h2>

        <div className="mt-6 grid max-w-3xl items-stretch gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-5">
          <article className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              {before.label}
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-rose-700 dark:text-rose-300">
              {before.value}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {before.unit}
            </p>
            <ComparisonBar
              value={before.value}
              maxValue={maxValue}
              tone="before"
            />
          </article>

          <div className="hidden items-center justify-center sm:flex">
            <ArrowRight className="size-5 text-zinc-400" aria-hidden />
          </div>

          <article className="rounded-lg border border-emerald-500/25 bg-white p-4 ring-1 ring-emerald-500/10 dark:border-emerald-500/20 dark:bg-zinc-950 sm:p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
              {after.label}
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-emerald-800 dark:text-emerald-200">
              {after.value}
            </p>
            <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {after.unit}
            </p>
            <ComparisonBar
              value={after.value}
              maxValue={maxValue}
              tone="after"
            />
          </article>
        </div>

        <div className="mt-4 max-w-3xl rounded-lg border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 sm:px-5 sm:py-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {estimated.label}
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
            {estimated.value}{" "}
            <span className="text-lg font-medium text-zinc-600 dark:text-zinc-400 sm:text-xl">
              {estimated.unit}
            </span>
          </p>
        </div>

        <p className="mt-4 max-w-3xl text-[12px] leading-relaxed text-zinc-500">
          {disclaimer}
        </p>
      </div>
    </section>
  );
}
