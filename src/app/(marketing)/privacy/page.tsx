import type { Metadata } from "next"

import { LegalBodySections } from "@/components/marketing/legal-body-sections"
import { MarketingLegalShell } from "@/components/marketing/marketing-legal-shell"
import { privacyPage } from "@/lib/legal-support-pages-content"

export const metadata: Metadata = {
  title: privacyPage.title,
  description: privacyPage.metaDescription,
  robots: { index: false, follow: false },
}

export default function PrivacyPage() {
  return (
    <MarketingLegalShell title={privacyPage.title}>
      <LegalBodySections sections={privacyPage.sections} />
    </MarketingLegalShell>
  )
}
