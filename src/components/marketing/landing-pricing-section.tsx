import Link from "next/link"
import { Check } from "lucide-react"

import { LandingCtaCluster } from "@/components/marketing/landing-inline-ctas"
import {
  LANDING_EXISTING_WORKSPACE_CHECKOUT,
  LANDING_PRICING,
  LANDING_PRICING_SECTION,
} from "@/lib/marketing-landing-copy"

const container = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"

export function LandingPricingSection() {
  return (
    <section
      className="border-b border-zinc-200 bg-white py-14 sm:py-16 dark:border-zinc-800 dark:bg-zinc-950"
      aria-labelledby="pricing-heading"
    >
      <div className={container}>
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {LANDING_PRICING_SECTION.eyebrow}
        </p>
        <h2
          id="pricing-heading"
          className="mt-3 max-w-[36ch] text-2xl font-semibold leading-[1.12] tracking-[-0.03em] text-zinc-950 sm:max-w-[48ch] dark:text-white"
        >
          {LANDING_PRICING_SECTION.title}
        </h2>

        <article className="mt-8 max-w-2xl rounded-lg border border-zinc-200 bg-zinc-50/50 p-6 ring-1 ring-zinc-950/[0.04] sm:p-8 dark:border-zinc-800 dark:bg-zinc-900/30 dark:ring-white/[0.06]">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
            <div className="flex flex-wrap items-end gap-x-2 gap-y-0">
              <span className="text-[2.75rem] font-semibold tabular-nums leading-none tracking-[-0.04em] text-zinc-950 sm:text-5xl dark:text-white">
                {LANDING_PRICING.priceDisplay}
              </span>
              <span className="pb-1 text-sm font-medium text-zinc-500">{LANDING_PRICING.currencyLabel}</span>
            </div>
            {LANDING_PRICING.installmentLine ? (
              <p className="text-[12px] font-medium leading-snug text-zinc-500 dark:text-zinc-400">
                {LANDING_PRICING.installmentLine}
              </p>
            ) : null}
          </div>

          <h3 className="mt-6 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
            {LANDING_PRICING.cardTitle}
          </h3>
          <ul className="mt-4 space-y-2.5">
            {LANDING_PRICING.includes.map((line) => (
              <li key={line} className="flex gap-2.5 text-[14px] leading-snug text-zinc-800 dark:text-zinc-200">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-zinc-950 dark:text-white"
                  strokeWidth={2.25}
                  aria-hidden
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 rounded-lg border border-zinc-200/80 bg-white px-4 py-4 dark:border-zinc-700/80 dark:bg-zinc-950/50 sm:px-5 sm:py-5">
            <p className="text-[13px] font-semibold text-zinc-950 dark:text-white">
              {LANDING_PRICING.paysForItselfHeading}
            </p>
            <ul className="mt-3 space-y-2">
              {LANDING_PRICING.paysForItselfItems.map((line) => (
                <li key={line} className="flex gap-2 text-[13px] leading-snug text-zinc-600 dark:text-zinc-400">
                  <span className="mt-2 size-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">{LANDING_PRICING.microcopy}</p>

          <LandingCtaCluster surface="onLight" scanFrom="landing-pricing" className="mt-7" />
          <p className="mt-3 text-[12px] leading-snug text-zinc-500 dark:text-zinc-400">
            {LANDING_EXISTING_WORKSPACE_CHECKOUT.lead}{" "}
            <Link
              href={LANDING_EXISTING_WORKSPACE_CHECKOUT.href}
              className="font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-2 transition-colors hover:text-zinc-950 dark:text-zinc-200 dark:decoration-zinc-600 dark:hover:text-white"
            >
              {LANDING_EXISTING_WORKSPACE_CHECKOUT.linkLabel}
            </Link>
          </p>
        </article>
      </div>
    </section>
  )
}
