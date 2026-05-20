import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { SubscribeClient } from "@/components/billing/subscribe-client"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { isBillingEnforced } from "@/lib/billing/config"
import { businessHasPaidRivetPurchase } from "@/lib/billing/rivet-access"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Get Rivet",
}

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>
}) {
  const sp = await searchParams
  const billingCanceled = sp.billing === "canceled"
  if (!isBillingEnforced()) {
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
      status: "ok",
      detail: "Stripe Checkout (test mode) opens when you continue.",
    },
  ]

  return (
    <DashboardRouteShell routePath="/subscribe" fetchLines={fetchLines}>
      <SubscribeClient email={user.email ?? ""} billingCanceled={billingCanceled} />
    </DashboardRouteShell>
  )
}
