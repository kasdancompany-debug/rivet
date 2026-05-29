import type { Metadata } from "next"

import { FounderDashboard } from "@/components/dashboard/founder-dashboard"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { getQuestionsPreventedMetrics } from "@/app/actions/ask-rivet"
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data"
import { getHighFrictionAlertsView } from "@/lib/high-friction-alerts/get-high-friction-alerts"
import { linesForDashboard } from "@/lib/route-reliability/diagnostic-builders"
import { EMOTIONAL_PROMISE } from "@/lib/product-voice"

export const metadata: Metadata = {
  title: "Can the business run without you?",
  description: EMOTIONAL_PROMISE,
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>
}) {
  const sp = await searchParams
  const postCheckoutNotice = sp.billing === "success"

  const [model, askMetrics, frictionView] = await Promise.all([
    getDashboardData(),
    getQuestionsPreventedMetrics(),
    getHighFrictionAlertsView(),
  ])
  const fetchLines = linesForDashboard(model)

  return (
    <DashboardRouteShell routePath="/dashboard" fetchLines={fetchLines}>
      <FounderDashboard
        model={model}
        askMetrics={askMetrics}
        frictionView={frictionView}
        postCheckoutNotice={postCheckoutNotice}
      />
    </DashboardRouteShell>
  )
}
