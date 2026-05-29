"use client"

import type { TrainingCertificateView } from "@/lib/training/certifications/load-certificate"
import { COPY } from "@/lib/interface-copy"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"

function formatCertDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function TrainingCertificate({
  certificate,
  className,
  printMode = false,
}: {
  certificate: TrainingCertificateView
  className?: string
  printMode?: boolean
}) {
  return (
    <article
      id="training-certificate"
      className={cn(
        "relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-50/90 via-background to-background shadow-xl dark:from-amber-950/20 dark:via-background dark:to-background print:border-amber-800/50 print:shadow-none",
        printMode ? "mx-auto max-w-[720px] shadow-none print:max-w-none" : "mx-auto max-w-lg",
        className
      )}
      aria-label={COPY.certifications.certificateAria(certificate.certificationName)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        aria-hidden
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)",
          backgroundSize: "12px 12px",
        }}
      />

      <header className="relative border-b border-amber-500/20 bg-amber-500/[0.06] px-6 py-5 text-center sm:px-10">
        <Logo className="mx-auto h-6 w-auto opacity-80" />
        <p className="mt-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-amber-800/80 dark:text-amber-200/80">
          {COPY.certifications.certificateEyebrow}
        </p>
      </header>

      <div className="relative px-6 py-8 text-center sm:px-10 sm:py-10">
        <p className="text-sm text-muted-foreground">{COPY.certifications.certificatePresentedTo}</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {certificate.employeeName}
        </h1>

        <div className="mx-auto my-6 h-px w-16 bg-amber-500/50" aria-hidden />

        <p className="text-sm text-muted-foreground">{COPY.certifications.certificateForCompleting}</p>
        <h2 className="mt-2 text-xl font-semibold leading-snug text-foreground sm:text-2xl">
          {certificate.certificationName}
        </h2>

        <dl className="mt-8 grid gap-4 text-left sm:grid-cols-2">
          <div className="rounded-xl border border-border/50 bg-background/80 px-4 py-3">
            <dt className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {COPY.certifications.certificateScore}
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {certificate.scorePct != null
                ? COPY.certifications.certificateScoreValue(certificate.scorePct)
                : COPY.certifications.certificateScoreNa}
            </dd>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/80 px-4 py-3">
            <dt className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {COPY.certifications.certificateDate}
            </dt>
            <dd className="mt-1 text-sm font-medium leading-snug text-foreground">
              {formatCertDate(certificate.certifiedAt)}
            </dd>
          </div>
          <div className="rounded-xl border border-border/50 bg-background/80 px-4 py-3 sm:col-span-2">
            <dt className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted-foreground">
              {COPY.certifications.certificateManager}
            </dt>
            <dd className="mt-1 text-sm font-medium text-foreground">
              {certificate.managerName && certificate.managerSignedOffAt
                ? COPY.certifications.certificateManagerLine(
                    certificate.managerName,
                    certificate.managerSignedOffAt
                  )
                : COPY.certifications.certificateManagerPending}
            </dd>
          </div>
        </dl>
      </div>

      <footer className="relative border-t border-amber-500/20 bg-muted/20 px-6 py-4 text-center sm:px-10">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {certificate.businessName}
        </p>
        <p className="mt-1 text-[0.62rem] text-muted-foreground/80">
          {COPY.certifications.certificateFooter}
        </p>
      </footer>

      <div
        className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full border border-amber-500/20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 size-40 rounded-full border border-amber-500/15"
        aria-hidden
      />
    </article>
  )
}
