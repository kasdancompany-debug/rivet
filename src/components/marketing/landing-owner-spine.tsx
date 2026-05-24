import { LANDING_OWNER_SPINE } from "@/lib/marketing-landing-copy";

export function LandingOwnerSpine() {
  const d = LANDING_OWNER_SPINE;
  return (
    <section
      className="relative border-b border-zinc-800 bg-zinc-950 py-14 text-zinc-100 sm:py-16 dark:border-zinc-800"
      aria-labelledby="owner-spine-heading"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {d.eyebrow}
        </p>
        <h2
          id="owner-spine-heading"
          className="mt-3 max-w-[24ch] text-2xl font-semibold leading-[1.1] tracking-[-0.03em] sm:max-w-[32ch] sm:text-[1.75rem] lg:text-3xl"
        >
          {d.title}
        </h2>
        <p className="mt-3 max-w-[44ch] text-[13px] font-normal leading-relaxed text-zinc-500">
          {d.subtitle}
        </p>

        <div className="mt-8 grid grid-cols-2 divide-x divide-y divide-white/[0.08] overflow-hidden rounded-lg border border-white/[0.1] bg-black/50 sm:grid-cols-4 sm:divide-y-0">
          {d.events.map((ev) => (
            <div
              key={ev.time}
              className="border-b border-white/[0.06] px-3 py-3 last:border-b-0 sm:border-b-0 sm:px-4 sm:py-3.5"
            >
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {ev.time}
              </p>
              <p className="mt-1.5 text-[13px] font-medium leading-snug text-zinc-200">
                {ev.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-px grid gap-px bg-white/[0.08] sm:grid-cols-2">
          <div className="bg-zinc-950/90 p-4 sm:p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Load · 7d
            </p>
            <p className="mt-2 text-lg font-semibold tabular-nums text-white sm:text-xl">
              {d.statLine}
            </p>
            <p className="mt-1 text-[12px] font-medium text-rose-300/90">
              {d.statDelta}
            </p>
          </div>
          <div className="bg-zinc-950/90 p-4 sm:p-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {d.traceTitle}
            </p>
            <ul className="mt-2 space-y-1.5">
              {d.traces.map((t) => (
                <li
                  key={t}
                  className="text-[13px] font-medium leading-snug text-zinc-300"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-px border border-white/[0.1] bg-black/40 p-4 sm:p-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {d.diagnosisEyebrow}
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-3 sm:gap-3">
            {d.diagnosis.map((row) => (
              <li
                key={row.id}
                className="border border-white/[0.08] bg-zinc-950/80 px-3 py-2.5 font-mono text-[10px] leading-snug text-zinc-400"
              >
                <span className="font-semibold text-zinc-500">{row.id}</span>
                <span className="mt-1.5 block font-sans text-[12px] font-medium leading-snug text-zinc-200">
                  {row.line}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600">
          {d.footnote}
        </p>
      </div>
    </section>
  );
}
