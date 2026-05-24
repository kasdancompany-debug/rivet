import { LandingHeroOperationalViz } from "@/components/marketing/landing-hero-viz";
import { LANDING_WORKSPACE_SNAPSHOT } from "@/lib/marketing-landing-copy";

export function LandingWorkspaceSnapshotSection() {
  const { title, bullets } = LANDING_WORKSPACE_SNAPSHOT;

  return (
    <section
      className="border-b border-zinc-200 bg-white py-6 sm:py-8 dark:border-zinc-800 dark:bg-zinc-950"
      aria-labelledby="workspace-snapshot-heading"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8 lg:px-8">
        <div>
          <h2
            id="workspace-snapshot-heading"
            className="text-xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-2xl dark:text-white"
          >
            {title}
          </h2>
          <ul className="mt-4 space-y-2">
            {bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-center gap-2.5 text-[0.9375rem] font-medium text-zinc-800 dark:text-zinc-200"
              >
                <span
                  className="size-1.5 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500"
                  aria-hidden
                />
                {bullet}
              </li>
            ))}
          </ul>
        </div>

        <LandingHeroOperationalViz screenshotOnly />
      </div>
    </section>
  );
}
