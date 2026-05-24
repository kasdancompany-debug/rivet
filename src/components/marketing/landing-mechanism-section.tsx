import { LandingHeroOperationalViz } from "@/components/marketing/landing-hero-viz";
import { LANDING_MECHANISM } from "@/lib/marketing-landing-copy";

export function LandingMechanismSection() {
  const { eyebrow, title, hook, steps } = LANDING_MECHANISM;

  return (
    <section
      id="mechanism-heading"
      className="border-b border-zinc-200 bg-zinc-50 py-8 sm:py-10 dark:border-zinc-800 dark:bg-zinc-900/25"
      aria-labelledby="mechanism-title"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8 lg:px-8">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {eyebrow}
          </p>
          <h2
            id="mechanism-title"
            className="mt-3 text-xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-2xl dark:text-white"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {hook}
          </p>
          <ol className="mt-5 space-y-3">
            {steps.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-white font-mono text-[11px] font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <LandingHeroOperationalViz screenshotOnly />
      </div>
    </section>
  );
}
