import type { Metadata } from "next"

import { QuestionsPreventedIntelligencePanel } from "@/components/ask-rivet/questions-prevented-intelligence-panel"
import { AskRivetPanel } from "@/components/ask-rivet/ask-rivet-panel"
import { AskRivetReviewPanel } from "@/components/ask-rivet/ask-rivet-review-panel"
import { HighFrictionAlertsPanel } from "@/components/high-friction/high-friction-alerts-panel"
import { listAskRivetReviewQueue } from "@/app/actions/ask-rivet-review"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { COPY } from "@/lib/interface-copy"
import { getHighFrictionAlertsView } from "@/lib/high-friction-alerts/get-high-friction-alerts"

export const metadata: Metadata = {
  title: COPY.nav.askRivet,
  description: COPY.askRivet.lead,
}

export default async function AskRivetPage() {
  const [frictionView, reviewQueue] = await Promise.all([
    getHighFrictionAlertsView(),
    listAskRivetReviewQueue(),
  ])

  return (
    <DashboardRouteShell routePath="/ask" fetchLines={[]}>
      <div className="mx-auto max-w-2xl space-y-8 pb-16">
        <AskRivetPanel />
        {reviewQueue.ok ? <AskRivetReviewPanel items={reviewQueue.items} /> : null}
        <QuestionsPreventedIntelligencePanel />
        {frictionView?.alerts.length ? (
          <HighFrictionAlertsPanel alerts={frictionView.alerts} compact />
        ) : null}
      </div>
    </DashboardRouteShell>
  )
}
