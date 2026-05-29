import { LANDING_PAIN } from "@/lib/marketing-landing-copy";

export function LandingPainSection() {
  const { eyebrow, title, hook, events } = LANDING_PAIN;

  return (
    <section
      className="border-b border-zinc-800 bg-zinc-950 py-10 text-zinc-100 sm:py-12"
      aria-labelledby="pain-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {eyebrow}
            </p>
            <h2
              id="pain-heading"
              className="mt-3 max-w-[22ch] text-2xl font-semibold tracking-[-0.03em] sm:text-3xl"
            >
              {title}
            </h2>
            <p className="mt-3 max-w-[36ch] text-[15px] leading-relaxed text-zinc-400">
              {hook}
            </p>
          </div>

          <div
            className="mx-auto w-full max-w-sm rounded-[1.75rem] border border-white/[0.12] bg-zinc-900/80 p-3 shadow-2xl shadow-black/40 ring-1 ring-white/[0.06]"
            aria-hidden
          >
            <div className="rounded-[1.25rem] border border-white/[0.08] bg-black/60 px-3 pb-3 pt-2">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Messages
                </p>
                <span className="size-1.5 rounded-full bg-emerald-400/90" />
              </div>
              <ul className="mt-2 space-y-2">
                {events.map((ev) => (
                  <li
                    key={ev.time}
                    className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                  >
                    <p className="font-mono text-[9px] text-zinc-600">{ev.time}</p>
                    <p className="mt-0.5 text-[13px] font-medium leading-snug text-zinc-200">
                      {ev.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
