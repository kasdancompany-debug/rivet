import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BillingDiagnosticsPanel } from "@/components/billing/billing-diagnostics-panel"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { getBillingDiagnosticsForCurrentUser } from "@/lib/billing/get-billing-diagnostics"
import { canAccessInternalBillingDiagnostics } from "@/lib/billing/internal-access"

export const metadata: Metadata = {
  title: "Billing diagnostics",
  robots: { index: false, follow: false },
}

export default async function InternalBillingCheckPage() {
  const user = requireAuthUser(await getServerAuthUser(), "/internal/billing-check")

  if (!canAccessInternalBillingDiagnostics(user.email)) {
    notFound()
  }

  const model = await getBillingDiagnosticsForCurrentUser()
  if (!model) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <BillingDiagnosticsPanel model={model} />
    </div>
  )
}
