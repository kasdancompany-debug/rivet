import Link from "next/link";

import { Logo } from "@/components/logo";

import { LandingHeroOperationalViz } from "@/components/marketing/landing-hero-viz";

import { LandingPainSection } from "@/components/marketing/landing-pain-section";

import { LandingDiagnosisSection } from "@/components/marketing/landing-diagnosis-section";

import { LandingMechanismSection } from "@/components/marketing/landing-mechanism-section";

import { LandingTransformationSection } from "@/components/marketing/landing-transformation-section";

import { LandingEscapeReadinessSection } from "@/components/marketing/landing-escape-readiness-section";

import { LandingPricingSection } from "@/components/marketing/landing-pricing-section";

import { LandingCtaCluster } from "@/components/marketing/landing-inline-ctas";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import {
  LANDING_CTA,
  LANDING_EXISTING_WORKSPACE_CHECKOUT,
  LANDING_FINAL_CTA,
  LANDING_FOOTER_TAGLINE,
  LANDING_FOOTER_TRUST,
  LANDING_HEADER_SIGN_IN,
  LANDING_HERO,
} from "@/lib/marketing-landing-copy";

import { landingFooterLegalLinks } from "@/lib/legal-support-pages-content";

const landingContainer = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

export function RivetLanding({
  signInHref = "/login",
}: {
  signInHref?: string;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-zinc-50 text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 text-zinc-950 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 dark:text-zinc-50">
        <div
          className={cn(
            landingContainer,
            "flex h-12 items-center justify-between sm:h-14",
          )}
        >
          <Logo href="/" />

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
      </header>

      <main className="flex flex-1 flex-col">
        {/* 1 Hero → 2 Pain → 3 Diagnosis → 4 Mechanism → 5 Transformation → 6 Escape → 7 Pricing → 8 CTA */}

        <section
          className="relative border-b border-zinc-800 bg-zinc-950 pb-12 pt-10 text-zinc-100 sm:pb-14 sm:pt-12 lg:pb-16 lg:pt-14"
          aria-labelledby="hero-heading"
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
            aria-hidden
          />

          <div
            className={cn(
              landingContainer,
              "relative grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-x-10",
            )}
          >
            <div className="lg:col-span-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                {LANDING_HERO.eyebrow}
              </p>

              <h1
                id="hero-heading"
                className="mt-4 max-w-[26ch] whitespace-pre-line text-balance text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-white sm:text-[2.5rem] lg:text-[2.625rem]"
              >
                {LANDING_HERO.headline}
              </h1>

              <p className="mt-4 max-w-[36ch] text-[15px] leading-relaxed text-zinc-400">
                {LANDING_HERO.subheadline}
              </p>

              <LandingCtaCluster
                surface="onDark"
                scanFrom="landing-hero"
                showScanSubline={false}
                className="mt-8"
              />
            </div>

            <div className="lg:col-span-8">
              <LandingHeroOperationalViz />
            </div>
          </div>
        </section>

        {/* 2 · Pain */}

        <LandingPainSection />

        {/* 3 · Diagnosis */}

        <LandingDiagnosisSection />

        {/* 4 · Mechanism */}

        <LandingMechanismSection />

        {/* 5 · Transformation */}

        <LandingTransformationSection />

        {/* 6 · Escape readiness payoff */}

        <LandingEscapeReadinessSection />

        {/* 7 · Price / value */}

        <LandingPricingSection />

        {/* 8 · CTA */}

        <section
          className="border-b border-zinc-800 bg-zinc-950 py-14 text-center text-zinc-50 sm:py-16"
          aria-labelledby="final-cta-heading"
        >
          <div className="mx-auto w-full max-w-lg px-4 sm:px-6">
            <h2
              id="final-cta-heading"
              className="text-balance text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl"
            >
              {LANDING_FINAL_CTA.title}
            </h2>

            <p className="mx-auto mt-3 max-w-[36ch] text-sm text-zinc-400">
              {LANDING_FINAL_CTA.body}
            </p>

            <LandingCtaCluster
              surface="onDark"
              primary="scan"
              scanFrom="landing-final"
              align="center"
              showScanSubline
              className="mt-8"
            />
          </div>
        </section>

        <footer className="border-t border-zinc-200 bg-white py-10 dark:border-zinc-800 dark:bg-zinc-950">
          <div className={cn(landingContainer, "grid gap-8 sm:grid-cols-12")}>
            <div className="sm:col-span-5">
              <Logo href="/" />

              <p className="mt-3 max-w-[44ch] text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                {LANDING_FOOTER_TAGLINE}
              </p>

              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                {LANDING_FOOTER_TRUST}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 sm:col-span-3 sm:border-l sm:border-zinc-200 sm:pl-8 dark:sm:border-zinc-800">
              <Link
                href="/signup"
                className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100"
              >
                {LANDING_CTA.primary}
              </Link>

              <Link
                href="/scan"
                className="text-[13px] font-medium text-zinc-600 dark:text-zinc-400"
              >
                {LANDING_CTA.secondary}
              </Link>

              <Link
                href="#mechanism-heading"
                scroll
                className="text-[13px] font-medium text-zinc-500"
              >
                {LANDING_CTA.tertiary}
              </Link>

              <Link
                href={signInHref}
                className="text-[12px] font-medium text-zinc-500"
              >
                {LANDING_HEADER_SIGN_IN}
              </Link>

              <Link
                href={LANDING_EXISTING_WORKSPACE_CHECKOUT.href}
                className="text-[12px] font-medium text-zinc-500"
              >
                {LANDING_EXISTING_WORKSPACE_CHECKOUT.linkLabel}
              </Link>
            </div>

            <div className="flex flex-col gap-2 sm:col-span-4 sm:border-l sm:border-zinc-200 sm:pl-8 dark:sm:border-zinc-800">
              <nav className="flex flex-col gap-2">
                {landingFooterLegalLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300"
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
  );
}
