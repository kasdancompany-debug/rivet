import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { KasdanPilotDashboard } from "@/components/internal/kasdan-pilot-dashboard"
import { getServerAuthUser, requireAuthUser } from "@/lib/auth/server-auth"
import { canAccessInternalDiagnostics } from "@/lib/billing/internal-access"
import { loadKasdanPilotDashboard } from "@/lib/internal-metrics/load-pilot-dashboard"
import { parsePilotWindowFromSearchParams } from "@/lib/internal-metrics/period"

export const metadata: Metadata = {
  title: "Kasdan pilot dashboard",
  description: "Internal owner-dependency metrics for Rivet pilot proof and case studies.",
  robots: { index: false, follow: false },
}

export default async function KasdanPilotPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = requireAuthUser(await getServerAuthUser(), "/internal/pilot")

  if (!canAccessInternalDiagnostics(user.email)) {
    notFound()
  }

  const sp = await searchParams
  const windowDays = parsePilotWindowFromSearchParams(sp)
  const model = await loadKasdanPilotDashboard(windowDays)

  if (!model) {
    notFound()
  }

  return <KasdanPilotDashboard model={model} />
}
