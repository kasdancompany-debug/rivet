import type { Metadata } from "next"
import Link from "next/link"

import { MarketingLegalShell } from "@/components/marketing/marketing-legal-shell"
import { SupportContactEmail } from "@/components/marketing/support-contact-email"
import { supportPage } from "@/lib/legal-support-pages-content"

export const metadata: Metadata = {
  title: supportPage.title,
  description: supportPage.metaDescription,
}

export default function SupportPage() {
  return (
    <MarketingLegalShell title={supportPage.title}>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
          {supportPage.contactHeading}
        </h2>
        <p>{supportPage.contactIntro}</p>
        <p>
          <SupportContactEmail />
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
          {supportPage.responseTimeHeading}
        </h2>
        <p>{supportPage.responseTimeBody}</p>
      </section>

      <section className="space-y-4 rounded-lg border border-zinc-200 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
          {supportPage.billingHeading}
        </h2>
        <p>{supportPage.billingIntro}</p>
        <div className="space-y-2">
          <p className="font-medium text-zinc-950 dark:text-white">{supportPage.founderProductName}</p>
          <ul className="list-disc space-y-2 pl-5">
            {supportPage.founderPricingLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <p className="text-[14px] font-medium uppercase tracking-wide text-zinc-500">Included</p>
          <ul className="list-disc space-y-2 pl-5">
            {supportPage.founderIncludes.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        <p className="text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          {supportPage.founderGrandfatherNote}
        </p>
        <ul className="list-disc space-y-2 border-t border-zinc-200 pt-4 pl-5 dark:border-zinc-800">
          {supportPage.billingHelpList.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
          {supportPage.includesHeading}
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          {supportPage.includes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
          {supportPage.excludesHeading}
        </h2>
        <ul className="list-disc space-y-2 pl-5">
          {supportPage.excludes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
          {supportPage.notSoftwareHeading}
        </h2>
        <p>{supportPage.notSoftwareBody}</p>
      </section>

      <section className="space-y-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Related</h2>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-[14px] font-medium">
          {supportPage.relatedLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline dark:text-zinc-300 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </section>
    </MarketingLegalShell>
  )
}
