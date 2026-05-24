import { LANDING_PAIN } from "@/lib/marketing-landing-copy";

export function LandingPainSection() {
  const { eyebrow, title, hook, events } = LANDING_PAIN;

  return (
    <section
      className="border-b border-zinc-800 bg-zinc-950 py-8 text-zinc-100 sm:py-10"
      aria-labelledby="pain-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {eyebrow}
        </p>
        <h2
          id="pain-heading"
          className="mt-3 max-w-[28ch] text-xl font-semibold tracking-[-0.03em] sm:text-2xl"
        >
          {title}
        </h2>
        <p className="mt-2 max-w-[40ch] text-sm text-zinc-400">{hook}</p>

        <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-white/[0.08] overflow-hidden rounded-lg border border-white/[0.1] bg-black/40 sm:grid-cols-4 sm:divide-y-0">
          {events.map((ev) => (
            <div key={ev.time} className="px-3 py-3 sm:px-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                {ev.time}
              </p>
              <p className="mt-1.5 text-[13px] font-medium leading-snug text-zinc-200">
                {ev.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
