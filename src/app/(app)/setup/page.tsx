import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { GuidedSetupForm } from "@/components/onboarding/guided-setup-form"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { businessHasPaidRivetPurchase } from "@/lib/billing/rivet-access"
import { shouldEnforceBillingGate } from "@/lib/billing/billing-readiness"
import {
  fetchBusinessForCurrentUser,
  fetchLatestDependencyAssessment,
} from "@/lib/db/queries"
import { getPostSetupRedirectPath } from "@/lib/onboarding/post-setup-redirect"
import { EMOTIONAL_PROMISE } from "@/lib/product-voice"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Set up your workspace",
  description: EMOTIONAL_PROMISE,
}

export default async function SetupPage() {
  requireAuthUser(await getServerAuthUser(), "/setup")
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (business) {
    if (shouldEnforceBillingGate()) {
      const paid = await businessHasPaidRivetPurchase(supabase, business.id)
      if (!paid) {
        redirect("/subscribe")
      }
    }
    if (!business.template_installed_at) {
      redirect("/onboarding")
    }
    const assessment = await fetchLatestDependencyAssessment(business.id, supabase)
    if (!assessment) {
      redirect("/onboarding?phase=reality-check")
    }
    redirect("/dashboard")
  }

  const fetchLines: RouteFetchLine[] = [
    {
      label: "Guided workspace setup",
      status: "ok",
      detail: "Name and business type before the Reality Check.",
    },
  ]

  return (
    <DashboardRouteShell routePath="/setup" fetchLines={fetchLines}>
      <div className="pb-4">
        <GuidedSetupForm postSetupHref={getPostSetupRedirectPath()} />
      </div>
    </DashboardRouteShell>
  )
}
