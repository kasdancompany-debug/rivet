import type { Metadata } from "next"

import { LegalBodySections, LegalEffectiveDateNote } from "@/components/marketing/legal-body-sections"
import { MarketingLegalShell } from "@/components/marketing/marketing-legal-shell"
import { privacyPage } from "@/lib/legal-support-pages-content"

export const metadata: Metadata = {
  title: privacyPage.title,
  description: privacyPage.metaDescription,
}

export default function PrivacyPage() {
  return (
    <MarketingLegalShell title={privacyPage.title} effectiveDate={privacyPage.effectiveDate}>
      <LegalEffectiveDateNote />
      <LegalBodySections sections={privacyPage.sections} />
    </MarketingLegalShell>
  )
}
