import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { IndustryTemplateOnboarding } from "@/components/onboarding/industry-template-onboarding"
import { OwnerOnboardingWizard } from "@/components/onboarding/owner-onboarding-wizard"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { businessHasPaidRivetPurchase } from "@/lib/billing/rivet-access"
import { shouldEnforceBillingGate } from "@/lib/billing/billing-readiness"
import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { EMOTIONAL_PROMISE } from "@/lib/product-voice"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Get started",
  description: EMOTIONAL_PROMISE,
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string }>
}) {
  const sp = await searchParams
  requireAuthUser(await getServerAuthUser(), "/onboarding")
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) {
    redirect("/setup")
  }

  if (shouldEnforceBillingGate()) {
    const paid = await businessHasPaidRivetPurchase(supabase, business.id)
    if (!paid) {
      redirect("/subscribe")
    }
  }

  const showRealityCheck = Boolean(business.template_installed_at) || sp.phase === "reality-check"

  const fetchLines: RouteFetchLine[] = [
    {
      label: showRealityCheck ? "Reality check wizard" : "Industry template install",
      status: "ok",
      detail: showRealityCheck
        ? "Owner dependency intake after foundation install."
        : "Pick your vertical; Rivet preloads SOPs, training, and workflows.",
    },
  ]

  return (
    <DashboardRouteShell routePath="/onboarding" fetchLines={fetchLines}>
      <div className="space-y-10 pb-4">
        {showRealityCheck ? <OwnerOnboardingWizard /> : <IndustryTemplateOnboarding businessName={business.name} />}
      </div>
    </DashboardRouteShell>
  )
}
