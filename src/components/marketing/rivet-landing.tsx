import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { Logo } from "@/components/logo"
import { LandingHeroOperationalViz } from "@/components/marketing/landing-hero-viz"
import { MarketingDemoDashboardStrip } from "@/components/marketing/marketing-demo-dashboard-strip"
import { LandingInstallsSection } from "@/components/marketing/landing-installs-section"
import { LandingBeforeAfter } from "@/components/marketing/landing-operational-demos"
import { LandingWorkspaceSnapshotSection } from "@/components/marketing/landing-workspace-snapshot-section"
import { LandingEscapeReadinessSection } from "@/components/marketing/landing-escape-readiness-section"
import { LandingResultsSection } from "@/components/marketing/landing-results-section"
import { LandingOwnerSpine } from "@/components/marketing/landing-owner-spine"
import { LandingPricingSection } from "@/components/marketing/landing-pricing-section"
import { LandingCtaCluster } from "@/components/marketing/landing-inline-ctas"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LANDING_BEFORE_AFTER,
  LANDING_CTA,
  LANDING_EXISTING_WORKSPACE_CHECKOUT,
  LANDING_FINAL_CTA,
  LANDING_FAQ,
  LANDING_FAQ_TITLE,
  LANDING_FOOTER_TAGLINE,
  LANDING_FOOTER_TRUST,
  LANDING_HEADER_SIGN_IN,
  LANDING_HERO,
  LANDING_INSTALLS,
  LANDING_YOU_FEEL_THIS,
} from "@/lib/marketing-landing-copy"
import { landingFooterLegalLinks } from "@/lib/legal-support-pages-content"

const landingContainer = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"

export function RivetLanding({ signInHref = "/login" }: { signInHref?: string }) {
  return (
    <div className="flex min-h-svh flex-col bg-zinc-50 text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 text-zinc-950 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-50">
        <div className={cn(landingContainer, "flex h-12 items-center justify-between sm:h-14")}>
          <Logo href="/" />
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-md px-3 text-[13px] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
              nativeButton={false}
              render={<Link href={signInHref} />}
            >
              {LANDING_HEADER_SIGN_IN}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {/* Hero â€” high contrast, minimal bloom, system typography */}
        <section
          className="relative border-b border-zinc-800 bg-zinc-950 pb-14 pt-12 text-zinc-100 sm:pb-16 sm:pt-16 lg:min-h-[min(86dvh,50rem)] lg:pb-20 lg:pt-20"
          aria-labelledby="hero-heading"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" aria-hidden />
          <div
            className={cn(
              landingContainer,
              "relative grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-x-12 lg:gap-y-0"
            )}
          >
            <div className="lg:col-span-4 lg:pr-2">
              <p className="font-mono text-[10px] font-semibold uppercase leading-none tracking-[0.22em] text-zinc-500">
                {LANDING_HERO.eyebrow}
              </p>
              <span className="mt-3 block h-px w-10 bg-zinc-600" aria-hidden />
              <h1
                id="hero-heading"
                className="mt-5 max-w-[26ch] whitespace-pre-line text-balance text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:max-w-[28ch] sm:text-[2.5rem] lg:text-[2.625rem]"
              >
                {LANDING_HERO.headline}
              </h1>
              <p className="mt-4 max-w-[36ch] text-pretty text-[15px] font-normal leading-[1.55] text-zinc-400 sm:text-[0.9375rem]">
                {LANDING_HERO.subheadline}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {LANDING_HERO.trustChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded border border-white/[0.12] bg-white/[0.03] px-2 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-zinc-400"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <LandingCtaCluster surface="onDark" scanFrom="landing-hero" className="mt-9" />

              <p className="mt-4 max-w-md text-[12px] leading-snug text-zinc-600">
                {LANDING_EXISTING_WORKSPACE_CHECKOUT.lead}{" "}
                <Link
                  href={LANDING_EXISTING_WORKSPACE_CHECKOUT.href}
                  className="font-medium text-zinc-300 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white hover:decoration-white/40"
                >
                  {LANDING_EXISTING_WORKSPACE_CHECKOUT.linkLabel}
                </Link>
              </p>
            </div>

            <div className="lg:col-span-8">
              <LandingHeroOperationalViz />
            </div>
          </div>
        </section>

        <section
          className="border-b border-zinc-200 bg-zinc-100 py-10 sm:py-12 dark:border-zinc-800 dark:bg-zinc-900/35"
          aria-label="Demo dashboard preview"
        >
          <div className={landingContainer}>
            <MarketingDemoDashboardStrip className="max-w-4xl" />
          </div>
        </section>

        {/* Field signal â€” inset grid, no floating list */}
        <section
          className="border-b border-zinc-200 bg-white py-12 sm:py-14 dark:border-zinc-800 dark:bg-zinc-950"
          aria-labelledby="feel-this-heading"
        >
          <div className={landingContainer}>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {LANDING_YOU_FEEL_THIS.eyebrow}
            </p>
            <h2
              id="feel-this-heading"
              className="mt-3 max-w-[28ch] text-xl font-semibold leading-[1.15] tracking-[-0.025em] text-zinc-950 sm:max-w-[40ch] sm:text-2xl dark:text-white"
            >
              {LANDING_YOU_FEEL_THIS.title}
            </h2>
            <div className="mt-8 grid gap-px bg-zinc-200/90 sm:grid-cols-3 dark:bg-zinc-800">
              {LANDING_YOU_FEEL_THIS.cards.map((line, i) => (
                <div
                  key={line}
                  className="flex min-h-[5.25rem] flex-col justify-center bg-white px-4 py-4 sm:min-h-[5.5rem] sm:px-5 dark:bg-zinc-950"
                >
                  <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 text-[0.875rem] font-medium leading-snug text-zinc-800 dark:text-zinc-200">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <LandingOwnerSpine />

        <LandingInstallsSection
          title={LANDING_INSTALLS.title}
          lead={LANDING_INSTALLS.lead}
          pillars={LANDING_INSTALLS.pillars}
        />

        <LandingWorkspaceSnapshotSection />

        <LandingResultsSection />

        <LandingEscapeReadinessSection />

        <LandingBeforeAfter
          eyebrow={LANDING_BEFORE_AFTER.eyebrow}
          title={LANDING_BEFORE_AFTER.title}
          before={LANDING_BEFORE_AFTER.before}
          after={LANDING_BEFORE_AFTER.after}
        />

        <LandingPricingSection />


        <section
          className="border-b border-zinc-200 bg-zinc-50 py-14 sm:py-16 dark:border-zinc-800 dark:bg-zinc-900/25"
          aria-labelledby="faq-heading"
        >
          <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8">
            <p className="text-center font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Support
            </p>
            <h2
              id="faq-heading"
              className="mt-2 text-center text-xl font-semibold tracking-[-0.025em] text-zinc-950 dark:text-white"
            >
              {LANDING_FAQ_TITLE}
            </h2>
            <div className="mt-8 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
              {LANDING_FAQ.map((item) => (
                <details key={item.q} className="group px-0 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-left sm:px-5 sm:py-[1.125rem]">
                    <span className="min-w-0 text-[13px] font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                      {item.q}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" aria-hidden />
                  </summary>
                  <div className="border-t border-zinc-100 px-4 pb-4 pt-3 sm:px-5 dark:border-zinc-800/80">
                    <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          className="border-b border-zinc-800 bg-zinc-950 py-16 text-center text-zinc-50 sm:py-20"
          aria-labelledby="final-cta-heading"
        >
          <div className="mx-auto w-full max-w-lg px-4 sm:px-6">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Deploy</p>
            <h2
              id="final-cta-heading"
              className="mt-3 text-balance text-2xl font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[1.75rem]"
            >
              {LANDING_FINAL_CTA.title}
            </h2>
            <p className="mx-auto mt-4 max-w-[36ch] text-pretty text-[13px] leading-relaxed text-zinc-400">
              {LANDING_FINAL_CTA.body}
            </p>
            <LandingCtaCluster
              surface="onDark"
              scanFrom="landing-final"
              align="center"
              showScanSubline={false}
              className="mt-9"
            />
          </div>
        </section>

        <footer className="border-t border-zinc-200 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-950">
          <div className={cn(landingContainer, "grid gap-10 sm:grid-cols-12 sm:gap-8")}>
            <div className="sm:col-span-5">
              <Logo href="/" />
              <p className="mt-3 max-w-[44ch] text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                {LANDING_FOOTER_TAGLINE}
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">{LANDING_FOOTER_TRUST}</p>
            </div>
            <div className="flex flex-col justify-end gap-3 border-t border-zinc-100 pt-8 sm:col-span-3 sm:border-t-0 sm:border-l sm:border-zinc-200 sm:pl-8 sm:pt-0 dark:border-zinc-800">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Access</p>
              <Link
                href="/signup"
                className="text-[13px] font-semibold text-zinc-900 transition-colors hover:text-zinc-950 dark:text-zinc-100 dark:hover:text-white"
              >
                {LANDING_CTA.primary}
              </Link>
              <Link
                href="/scan"
                className="text-[13px] font-medium text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {LANDING_CTA.secondary}
              </Link>
              <Link
                href="#installs-heading"
                scroll
                className="text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                {LANDING_CTA.tertiary}
              </Link>
              <Link
                href={signInHref}
                className="mt-1 text-[12px] font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                {LANDING_HEADER_SIGN_IN}
              </Link>
              <Link
                href={LANDING_EXISTING_WORKSPACE_CHECKOUT.href}
                className="text-[12px] font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                {LANDING_EXISTING_WORKSPACE_CHECKOUT.linkLabel}
              </Link>
            </div>
            <div className="flex flex-col justify-end gap-3 border-t border-zinc-100 pt-8 sm:col-span-4 sm:border-t-0 sm:border-l sm:border-zinc-200 sm:pl-8 sm:pt-0 dark:border-zinc-800">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Legal & support</p>
              <nav className="flex flex-col gap-2.5">
                {landingFooterLegalLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-[13px] font-medium text-zinc-700 transition-colors hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
