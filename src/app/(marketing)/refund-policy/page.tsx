import type { Metadata } from "next"

import { LegalBodySections, LegalEffectiveDateNote } from "@/components/marketing/legal-body-sections"
import { MarketingLegalShell } from "@/components/marketing/marketing-legal-shell"
import { refundPolicyPage } from "@/lib/legal-support-pages-content"

export const metadata: Metadata = {
  title: refundPolicyPage.title,
  description: refundPolicyPage.metaDescription,
}

export default function RefundPolicyPage() {
  return (
    <MarketingLegalShell title={refundPolicyPage.title} effectiveDate={refundPolicyPage.effectiveDate}>
      <LegalEffectiveDateNote />
      <LegalBodySections sections={refundPolicyPage.sections} />
    </MarketingLegalShell>
  )
}
