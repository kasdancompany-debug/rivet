import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { SubscribeClient } from "@/components/billing/subscribe-client"
import { RIVET_PRICING } from "@/lib/pricing-copy"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { getBillingReadiness, isBillingEnforced } from "@/lib/billing/config"
import { founderStripePriceId } from "@/lib/billing/founder-offer"
import { confirmCheckoutSession } from "@/app/actions/billing"
import { businessHasRivetAppAccess } from "@/lib/billing/rivet-access"
import type { RouteFetchLine } from "@/lib/route-reliability/types"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: RIVET_PRICING.subscribeTitle,
  description: `${RIVET_PRICING.priceOnce} ${RIVET_PRICING.priceInstallment}. ${RIVET_PRICING.positioningShort}`,
}

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; session_id?: string; message?: string }>
}) {
  const sp = await searchParams
  const billingCanceled = sp.billing === "canceled"
  const readiness = getBillingReadiness()

  if (readiness.status === "off") {
    redirect("/dashboard")
  }

  const user = requireAuthUser(await getServerAuthUser(), "/subscribe")

  if (sp.billing === "success" && sp.session_id?.trim()) {
    const confirmed = await confirmCheckoutSession(sp.session_id.trim())
    if (confirmed.ok && confirmed.hasAppAccess) {
      redirect("/dashboard?billing=success")
    }
    if (confirmed.ok && !confirmed.hasAppAccess) {
      redirect("/subscribe?billing=installment_pending")
    }
    if (!confirmed.ok && confirmed.pending) {
      redirect("/subscribe?billing=pending")
    }
    if (!confirmed.ok) {
      redirect(`/subscribe?billing=confirm_error&message=${encodeURIComponent(confirmed.message)}`)
    }
  }

  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.business_id) {
    redirect("/setup?next=/subscribe")
  }

  const hasAccess = await businessHasRivetAppAccess(supabase, profile.business_id, user.id)
  if (hasAccess) {
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
        billingStatusMessage={
          sp.billing === "pending"
            ? "Payment is still processing. Refresh this page in a moment."
            : sp.billing === "installment_pending"
              ? "Installment received. Complete all three payments to unlock full access."
              : sp.billing === "confirm_error" && typeof sp.message === "string"
                ? decodeURIComponent(sp.message)
                : null
        }
        checkoutDisabledMessage={isBillingEnforced() ? null : readiness.message}
        installmentCheckoutAvailable={Boolean(founderStripePriceId("installment_3"))}
      />
    </DashboardRouteShell>
  )
}
