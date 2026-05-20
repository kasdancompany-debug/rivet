import type { Metadata } from "next"

import { MarketingLegalShell } from "@/components/marketing/marketing-legal-shell"
import {
  SUPPORT_CONTACT_EMAIL_PLACEHOLDER,
  SUPPORT_CONTENT_REVIEW_NOTE,
  supportPage,
} from "@/lib/legal-support-pages-content"

export const metadata: Metadata = {
  title: supportPage.title,
  description: supportPage.metaDescription,
  robots: { index: false, follow: false },
}

export default function SupportPage() {
  return (
    <MarketingLegalShell title={supportPage.title} showLegalBanner={false}>
      <p className="rounded-lg border border-sky-500/25 bg-sky-500/[0.06] px-4 py-3 text-[13px] leading-relaxed text-sky-950 dark:border-sky-500/20 dark:bg-sky-500/[0.08] dark:text-sky-100/95">
        {SUPPORT_CONTENT_REVIEW_NOTE}
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">{supportPage.contactHeading}</h2>
        <p>{supportPage.contactIntro}</p>
        <p>
          <span className="font-mono text-[0.9375rem] font-medium text-zinc-950 dark:text-white">
            {SUPPORT_CONTACT_EMAIL_PLACEHOLDER}
          </span>
        </p>
        <p className="text-[14px] text-zinc-600 dark:text-zinc-400">{supportPage.contactNote}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
          {supportPage.responseTimeHeading}
        </h2>
        <p>{supportPage.responseTimeBody}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">{supportPage.includesHeading}</h2>
        <ul className="list-disc space-y-2 pl-5">
          {supportPage.includes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">{supportPage.excludesHeading}</h2>
        <ul className="list-disc space-y-2 pl-5">
          {supportPage.excludes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">{supportPage.notSoftwareHeading}</h2>
        <p>{supportPage.notSoftwareBody}</p>
        <p className="text-[14px] text-zinc-600 dark:text-zinc-400">{supportPage.footerNote}</p>
      </section>
    </MarketingLegalShell>
  )
}
