import Link from "next/link";

import { LandingCtaCluster } from "@/components/marketing/landing-inline-ctas";
import {
  LANDING_EXISTING_WORKSPACE_CHECKOUT,
  LANDING_VALUE,
} from "@/lib/marketing-landing-copy";

const container = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

export function LandingPricingSection() {
  const { eyebrow, title, hook, ownerTimeAtRisk, rivetCost, microcopy } =
    LANDING_VALUE;

  return (
    <section
      className="border-b border-zinc-200 bg-zinc-50 py-8 sm:py-10 dark:border-zinc-800 dark:bg-zinc-900/25"
      aria-labelledby="pricing-heading"
    >
      <div className={container}>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {eyebrow}
        </p>
        <h2
          id="pricing-heading"
          className="mt-3 max-w-[32ch] text-xl font-semibold tracking-[-0.03em] text-zinc-950 sm:text-2xl dark:text-white"
        >
          {title}
        </h2>
        <p className="mt-2 max-w-[44ch] text-sm text-zinc-600 dark:text-zinc-400">
          {hook}
        </p>

        <div className="mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
          <article className="rounded-lg border border-rose-500/20 bg-white p-5 dark:border-rose-500/15 dark:bg-zinc-950">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              {ownerTimeAtRisk.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-rose-800 dark:text-rose-200">
              {ownerTimeAtRisk.value}
            </p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              {ownerTimeAtRisk.note}
            </p>
          </article>
          <article className="rounded-lg border border-zinc-300 bg-white p-5 ring-1 ring-zinc-950/[0.04] dark:border-zinc-700 dark:bg-zinc-950 dark:ring-white/[0.06]">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
              {rivetCost.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-950 dark:text-white">
              {rivetCost.value}
            </p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              {rivetCost.note}
            </p>
          </article>
        </div>

        <p className="mt-4 max-w-3xl text-sm text-zinc-700 dark:text-zinc-300">
          {microcopy}
        </p>

        <LandingCtaCluster
          surface="onLight"
          scanFrom="landing-pricing"
          showScanSubline={false}
          className="mt-6"
        />
        <p className="mt-3 text-[12px] text-zinc-500">
          {LANDING_EXISTING_WORKSPACE_CHECKOUT.lead}{" "}
          <Link
            href={LANDING_EXISTING_WORKSPACE_CHECKOUT.href}
            className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-950 dark:text-zinc-300"
          >
            {LANDING_EXISTING_WORKSPACE_CHECKOUT.linkLabel}
          </Link>
        </p>
      </div>
    </section>
  );
}
