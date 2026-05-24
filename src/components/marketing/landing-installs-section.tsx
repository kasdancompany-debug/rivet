import { Check } from "lucide-react";

import { LANDING_INSTALLS } from "@/lib/marketing-landing-copy";

export function LandingInstallsSection() {
  const { title, items } = LANDING_INSTALLS;

  return (
    <section
      className="border-b border-zinc-200 bg-zinc-50 py-6 sm:py-8 dark:border-zinc-800 dark:bg-zinc-950"
      aria-labelledby="installs-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2
          id="installs-heading"
          className="text-xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-2xl dark:text-white"
        >
          {title}
        </h2>
        <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-[0.9375rem] font-medium text-zinc-800 dark:text-zinc-200"
            >
              <Check
                className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
