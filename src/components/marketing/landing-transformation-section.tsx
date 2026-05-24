import { ArrowRight } from "lucide-react";

import { LANDING_TRANSFORMATION } from "@/lib/marketing-landing-copy";
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
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div
        className={cn(
          "h-full rounded-full",
          tone === "before" ? "bg-rose-500/80" : "bg-emerald-500/85",
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function LandingTransformationSection() {
  const {
    eyebrow,
    title,
    hook,
    comparison,
    estimated,
    beforeBullets,
    afterBullets,
    disclaimer,
  } = LANDING_TRANSFORMATION;
  const { before, after, maxValue } = comparison;

  return (
    <section
      className="border-b border-zinc-200 bg-white py-8 sm:py-10 dark:border-zinc-800 dark:bg-zinc-950"
      aria-labelledby="transformation-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {eyebrow}
        </p>
        <h2
          id="transformation-heading"
          className="mt-3 text-xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-2xl dark:text-white"
        >
          {title}
        </h2>
        <p className="mt-2 max-w-[44ch] text-sm text-zinc-600 dark:text-zinc-400">
          {hook}
        </p>

        <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              {before.label}
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-rose-700 dark:text-rose-300">
              {before.value}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {before.unit}
            </p>
            <ComparisonBar
              value={before.value}
              maxValue={maxValue}
              tone="before"
            />
          </div>
          <ArrowRight
            className="hidden size-5 text-zinc-400 sm:block"
            aria-hidden
          />
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
              {after.label}
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">
              {after.value}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {after.unit}
            </p>
            <ComparisonBar
              value={after.value}
              maxValue={maxValue}
              tone="after"
            />
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {estimated.label}:{" "}
          <span className="tabular-nums">{estimated.value}</span>{" "}
          {estimated.unit}
        </p>

        <div className="mt-6 grid overflow-hidden rounded-lg border border-zinc-200 sm:grid-cols-2 dark:border-zinc-800">
          <div className="border-b border-zinc-200 bg-zinc-50 p-4 sm:border-b-0 sm:border-r dark:border-zinc-800 dark:bg-zinc-900/35">
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Before
            </h3>
            <ul className="mt-3 space-y-2">
              {beforeBullets.map((line) => (
                <li
                  key={line}
                  className="text-sm text-zinc-600 dark:text-zinc-400"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-4">
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700 dark:text-zinc-300">
              After
            </h3>
            <ul className="mt-3 space-y-2">
              {afterBullets.map((line) => (
                <li
                  key={line}
                  className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-zinc-500">{disclaimer}</p>
      </div>
    </section>
  );
}
