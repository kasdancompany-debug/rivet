import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { SubscribeClient } from "@/components/billing/subscribe-client"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { getBillingReadiness, isBillingEnforced } from "@/lib/billing/config"
import { businessHasPaidRivetPurchase } from "@/lib/billing/rivet-access"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Get Rivet",
  description:
    "One-time $799 CAD. Unlock procedures, training, owner-interruption log, bottlenecks, escape readiness, and owner overview for your workspace.",
}

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>
}) {
  const sp = await searchParams
  const billingCanceled = sp.billing === "canceled"
  const readiness = getBillingReadiness()

  if (readiness.status === "off") {
    redirect("/dashboard")
  }

  const user = requireAuthUser(await getServerAuthUser(), "/subscribe")
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.business_id) {
    redirect("/setup?next=/subscribe")
  }

  const paid = await businessHasPaidRivetPurchase(supabase, profile.business_id)
  if (paid) {
    redirect("/dashboard")
  }

  const fetchLines: RouteFetchLine[] = [
    {
      label: "Billing",
      status: isBillingEnforced() ? "ok" : "empty",
      detail: isBillingEnforced()
        ? "Stripe Checkout (test mode) opens when you continue."
        : "Checkout blocked until all billing environment variables are set.",
    },
  ]

  return (
    <DashboardRouteShell routePath="/subscribe" fetchLines={fetchLines}>
      <SubscribeClient
        email={user.email ?? ""}
        billingCanceled={billingCanceled}
        checkoutDisabledMessage={isBillingEnforced() ? null : readiness.message}
      />
    </DashboardRouteShell>
  )
}
