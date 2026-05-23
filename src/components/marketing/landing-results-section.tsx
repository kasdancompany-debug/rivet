import { LANDING_RESULTS } from "@/lib/marketing-landing-copy"
import { cn } from "@/lib/utils"

function BulletList({ items, muted }: { items: readonly string[]; muted?: boolean }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((line) => (
        <li key={line} className="flex gap-2.5 text-[13px] leading-snug">
          <span
            className={cn(
              "mt-[0.45rem] size-1 shrink-0 rounded-full",
              muted ? "bg-zinc-400 dark:bg-zinc-600" : "bg-zinc-500 dark:bg-zinc-400"
            )}
            aria-hidden
          />
          <span className={muted ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-800 dark:text-zinc-200"}>
            {line}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function LandingResultsSection() {
  const {
    eyebrow,
    title,
    lead,
    exampleBadge,
    patternNote,
    scenario,
    beforeRivet,
    afterRivet,
    financial,
    disclaimer,
  } = LANDING_RESULTS

  return (
    <section
      className="border-b border-zinc-200 bg-zinc-50 py-14 sm:py-16 dark:border-zinc-800 dark:bg-zinc-900/25"
      aria-labelledby="results-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{eyebrow}</p>
        <h2
          id="results-heading"
          className="mt-3 max-w-[32ch] text-2xl font-semibold leading-[1.12] tracking-[-0.03em] text-zinc-950 sm:max-w-none sm:text-[1.75rem] dark:text-white"
        >
          {title}
        </h2>
        <p className="mt-4 max-w-[52ch] text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">{lead}</p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="rounded border border-zinc-300/80 bg-white px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
            {exampleBadge}
          </span>
          <span className="text-[12px] text-zinc-500 dark:text-zinc-500">{patternNote}</span>
        </div>
        <p className="mt-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">{scenario}</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2 lg:gap-5">
          <article className="flex flex-col rounded-lg border border-zinc-200 bg-white ring-1 ring-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/[0.04]">
            <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:px-6">
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {beforeRivet.heading}
              </h3>
              <p className="mt-2 text-[14px] font-medium leading-snug text-zinc-800 dark:text-zinc-200">
                {beforeRivet.summary}
              </p>
            </div>
            <div className="flex flex-1 px-5 py-4 sm:px-6 sm:py-5">
              <BulletList items={beforeRivet.items} muted />
            </div>
          </article>

          <article className="flex flex-col rounded-lg border border-zinc-300 bg-white shadow-sm ring-1 ring-zinc-950/[0.05] dark:border-zinc-700 dark:bg-zinc-950 dark:ring-white/[0.06]">
            <div className="border-b border-zinc-200 bg-zinc-950 px-5 py-4 dark:border-zinc-800 sm:px-6">
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                {afterRivet.heading}
              </h3>
              <p className="mt-2 text-[14px] font-medium leading-snug text-zinc-100">{afterRivet.summary}</p>
            </div>
            <div className="flex flex-1 px-5 py-4 sm:px-6 sm:py-5">
              <BulletList items={afterRivet.items} />
            </div>
          </article>
        </div>

        <div className="mt-6 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800 sm:px-6">
            <h3 className="text-[14px] font-semibold tracking-tight text-zinc-950 dark:text-white">
              {financial.heading}
            </h3>
            <ol className="mt-3 list-none space-y-1.5 p-0">
              {financial.steps.map((step, i) => (
                <li
                  key={step}
                  className="flex gap-2 text-[13px] leading-snug text-zinc-600 dark:text-zinc-400"
                >
                  <span className="shrink-0 font-mono text-[10px] font-medium tabular-nums text-zinc-400">
                    {i + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid divide-y divide-zinc-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-zinc-800">
            <div className="px-5 py-5 sm:px-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-500">
                {financial.annualExampleLabel}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-500 line-through decoration-zinc-300 dark:text-zinc-500 dark:decoration-zinc-600">
                {financial.annualExampleAmount}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">if those hours stayed on your plate all year</p>
            </div>
            <div className="px-5 py-5 sm:px-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-500">
                {financial.licenseLabel}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-zinc-950 dark:text-white">
                {financial.licenseAmount}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">{financial.licenseNote}</p>
            </div>
          </div>

          <p className="border-t border-zinc-200 px-5 py-4 text-[13px] leading-relaxed text-zinc-700 dark:border-zinc-800 dark:text-zinc-300 sm:px-6">
            {financial.punchline}
          </p>
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-500">{disclaimer}</p>
      </div>
    </section>
  )
}
