import type { Metadata } from "next"

import { LegalBodySections } from "@/components/marketing/legal-body-sections"
import { MarketingLegalShell } from "@/components/marketing/marketing-legal-shell"
import { refundPolicyPage } from "@/lib/legal-support-pages-content"

export const metadata: Metadata = {
  title: refundPolicyPage.title,
  description: refundPolicyPage.metaDescription,
  robots: { index: false, follow: false },
}

export default function RefundPolicyPage() {
  return (
    <MarketingLegalShell title={refundPolicyPage.title}>
      <LegalBodySections sections={refundPolicyPage.sections} />
    </MarketingLegalShell>
  )
}
