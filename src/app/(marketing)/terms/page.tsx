import type { Metadata } from "next"

import { LegalBodySections, LegalEffectiveDateNote } from "@/components/marketing/legal-body-sections"
import { MarketingLegalShell } from "@/components/marketing/marketing-legal-shell"
import { termsPage } from "@/lib/legal-support-pages-content"

export const metadata: Metadata = {
  title: termsPage.title,
  description: termsPage.metaDescription,
}

export default function TermsPage() {
  return (
    <MarketingLegalShell title={termsPage.title} effectiveDate={termsPage.effectiveDate}>
      <LegalEffectiveDateNote />
      <LegalBodySections sections={termsPage.sections} />
    </MarketingLegalShell>
  )
}
