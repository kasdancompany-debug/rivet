import type { Metadata } from "next"

import { QuestionsPreventedIntelligencePanel } from "@/components/ask-rivet/questions-prevented-intelligence-panel"
import { HighFrictionAlertsPanel } from "@/components/high-friction/high-friction-alerts-panel"
import { AppPageHeader } from "@/components/app-page-header"
import { DashboardRouteShell } from "@/components/route-reliability/dashboard-route-shell"
import { COPY } from "@/lib/interface-copy"
import { getHighFrictionAlertsView } from "@/lib/high-friction-alerts/get-high-friction-alerts"

export const metadata: Metadata = {
  title: COPY.askRivet.questionsPreventedPageTitle,
  description: COPY.askRivet.questionsPreventedIntelLead,
}

export default async function QuestionsPreventedPage() {
  const frictionView = await getHighFrictionAlertsView()

  return (
    <DashboardRouteShell routePath="/questions-prevented" fetchLines={[]}>
      <>
        <AppPageHeader
          eyebrow={COPY.askRivet.intelligenceEyebrow}
          title={COPY.askRivet.questionsPreventedPageTitle}
          description={COPY.askRivet.questionsPreventedPageDesc}
        />
        <div className="mt-8 max-w-4xl space-y-8">
          <QuestionsPreventedIntelligencePanel />
          {frictionView?.alerts.length ? (
            <HighFrictionAlertsPanel alerts={frictionView.alerts} />
          ) : null}
        </div>
      </>
    </DashboardRouteShell>
  )
}
