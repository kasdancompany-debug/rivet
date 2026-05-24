import { MarketingDemoDashboardStrip } from "@/components/marketing/marketing-demo-dashboard-strip";
import { LANDING_DIAGNOSIS } from "@/lib/marketing-landing-copy";

export function LandingDiagnosisSection() {
  const { eyebrow, title, hook, metrics } = LANDING_DIAGNOSIS;

  return (
    <section
      className="border-b border-zinc-200 bg-white py-8 sm:py-10 dark:border-zinc-800 dark:bg-zinc-950"
      aria-labelledby="diagnosis-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {eyebrow}
        </p>
        <h2
          id="diagnosis-heading"
          className="mt-3 max-w-[32ch] text-xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-2xl dark:text-white"
        >
          {title}
        </h2>
        <p className="mt-2 max-w-[44ch] text-sm text-zinc-600 dark:text-zinc-400">
          {hook}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {m.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950 dark:text-white">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <MarketingDemoDashboardStrip />
        </div>
      </div>
    </section>
  );
}
