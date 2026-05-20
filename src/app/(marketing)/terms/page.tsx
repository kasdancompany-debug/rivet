import type { Metadata } from "next"

import { LegalBodySections } from "@/components/marketing/legal-body-sections"
import { MarketingLegalShell } from "@/components/marketing/marketing-legal-shell"
import { termsPage } from "@/lib/legal-support-pages-content"

export const metadata: Metadata = {
  title: termsPage.title,
  description: termsPage.metaDescription,
  robots: { index: false, follow: false },
}

export default function TermsPage() {
  return (
    <MarketingLegalShell title={termsPage.title}>
      <LegalBodySections sections={termsPage.sections} />
    </MarketingLegalShell>
  )
}
