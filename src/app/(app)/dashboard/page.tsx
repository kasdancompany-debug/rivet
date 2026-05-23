import type { Metadata } from "next"

import { FounderDashboard } from "@/components/dashboard/founder-dashboard"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data"
import { linesForDashboard } from "@/lib/route-reliability/diagnostic-builders"
import { EMOTIONAL_PROMISE } from "@/lib/product-voice"

export const metadata: Metadata = {
  title: "Overview",
  description: EMOTIONAL_PROMISE,
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>
}) {
  const sp = await searchParams
  const postCheckoutNotice = sp.billing === "success"

  const model = await getDashboardData()
  const fetchLines = linesForDashboard(model)

  return (
    <DashboardRouteShell routePath="/dashboard" fetchLines={fetchLines}>
      <FounderDashboard model={model} postCheckoutNotice={postCheckoutNotice} />
    </DashboardRouteShell>
  )
}
