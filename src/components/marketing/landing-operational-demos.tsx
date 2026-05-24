export function LandingBeforeAfter({
  eyebrow,
  title,
  before,
  after,
}: {
  eyebrow: string;
  title: string;
  before: readonly string[];
  after: readonly string[];
}) {
  return (
    <section
      className="border-b border-zinc-200 bg-white py-14 sm:py-16 dark:border-zinc-800 dark:bg-zinc-950"
      aria-labelledby="before-after-heading"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {eyebrow}
        </p>
        <h2
          id="before-after-heading"
          className="mt-3 max-w-[32ch] text-2xl font-semibold leading-[1.12] tracking-[-0.03em] text-zinc-950 sm:max-w-none sm:text-[1.75rem] dark:text-white"
        >
          {title}
        </h2>

        <div className="mt-8 overflow-hidden rounded-lg border border-zinc-200 ring-1 ring-zinc-950/[0.03] dark:border-zinc-800 dark:ring-white/[0.04] sm:grid sm:grid-cols-2">
          <div className="border-b border-zinc-200 bg-zinc-50 p-5 sm:border-b-0 sm:border-r sm:p-6 dark:border-zinc-800 dark:bg-zinc-900/35">
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Before
            </h3>
            <ul className="mt-4 space-y-3">
              {before.map((line) => (
                <li
                  key={line}
                  className="flex gap-3 text-[13px] leading-snug text-zinc-600 dark:text-zinc-400"
                >
                  <span
                    className="mt-2 size-1 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600"
                    aria-hidden
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-5 sm:p-6 dark:bg-zinc-950">
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-700 dark:text-zinc-300">
              After
            </h3>
            <ul className="mt-4 space-y-3">
              {after.map((line) => (
                <li
                  key={line}
                  className="flex gap-3 text-[13px] font-medium leading-snug text-zinc-900 dark:text-zinc-100"
                >
                  <span
                    className="mt-2 size-1 shrink-0 rounded-full bg-zinc-950 dark:bg-white"
                    aria-hidden
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
