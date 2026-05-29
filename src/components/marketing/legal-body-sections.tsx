import Link from "next/link"
import type { ReactNode } from "react"

import type { LegalSection } from "@/lib/legal-section"
import { LEGAL_LAST_UPDATED, SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site-legal-config"

export type { LegalSection } from "@/lib/legal-section"

function renderInlineContact(text: string): ReactNode {
  const parts = text.split(SUPPORT_EMAIL)
  if (parts.length === 1) return text
  return parts.flatMap((part, i) => {
    const nodes: ReactNode[] = []
    if (part) nodes.push(part)
    if (i < parts.length - 1) {
      nodes.push(
        <a
          key={`email-${i}`}
          href={SUPPORT_MAILTO}
          className="font-medium text-zinc-950 underline underline-offset-2 hover:text-zinc-700 dark:text-white dark:hover:text-zinc-200"
        >
          {SUPPORT_EMAIL}
        </a>
      )
    }
    return nodes
  })
}

export function LegalBodySections({ sections }: { sections: readonly LegalSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
            {section.heading}
          </h2>
          {section.body?.length ? (
            <div className="space-y-3">
              {section.body.map((p, i) => (
                <p key={`${section.heading}-p-${i}`}>{renderInlineContact(p)}</p>
              ))}
            </div>
          ) : null}
          {section.list?.length ? (
            <ul className="list-disc space-y-2 pl-5">
              {section.list.map((item) => (
                <li key={item}>{renderInlineContact(item)}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </>
  )
}

export function LegalEffectiveDateNote() {
  return (
    <p className="text-[14px] text-zinc-600 dark:text-zinc-400">
      Effective {LEGAL_LAST_UPDATED}. See also our{" "}
      <Link
        href="/privacy"
        className="font-medium underline underline-offset-2 hover:text-zinc-950 dark:hover:text-white"
      >
        Privacy Policy
      </Link>
      ,{" "}
      <Link
        href="/refund-policy"
        className="font-medium underline underline-offset-2 hover:text-zinc-950 dark:hover:text-white"
      >
        Refund Policy
      </Link>
      , and{" "}
      <Link
        href="/support"
        className="font-medium underline underline-offset-2 hover:text-zinc-950 dark:hover:text-white"
      >
        Support
      </Link>{" "}
      page.
    </p>
  )
}
