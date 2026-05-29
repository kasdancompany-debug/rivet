import type { HighFrictionAlertsView } from "@/lib/high-friction-alerts/types"
import type { DashboardViewModel } from "@/lib/dashboard/types"
import type { ProofOfTransferView } from "@/lib/proof-of-transfer/types"

import { suggestedFixFromUnknown } from "./suggested-fix"
import type { RouteFetchLine } from "./types"

export function linesForDashboard(model: DashboardViewModel): RouteFetchLine[] {
  if (model.source === "live") {
    return [
      {
        label: "Overview workspace",
        status: "ok",
        detail: model.businessName ? `Linked: ${model.businessName}` : "Linked workspace loaded.",
      },
    ]
  }
  if (model.source === "setup") {
    return [
      {
        label: "Overview workspace",
        status: "empty",
        detail: "No business row for this user yet.",
        missing: ["business (workspace)"],
        suggestedFix:
          "Open Settings → use the Workspace card to name your business, or insert a businesses row and set profiles.business_id in Supabase.",
      },
    ]
  }
  return [
    {
      label: "Overview aggregate fetch",
      status: "error",
      detail: "getDashboardData fell back to the error shell.",
      suggestedFix: "Inspect get-dashboard-data catch path and Supabase errors in server logs.",
    },
  ]
}

export function linesForAlerts(view: HighFrictionAlertsView | null): RouteFetchLine[] {
  if (!view) {
    return [
      {
        label: "High friction alerts",
        status: "empty",
        detail: "No workspace linked.",
        missing: ["business"],
        suggestedFix: "Link a business in Settings.",
      },
    ]
  }
  return [
    {
      label: "High friction alerts",
      status: view.alerts.length > 0 ? "ok" : "empty",
      detail:
        view.alerts.length > 0
          ? `${view.alerts.length} active alert(s) from Ask Rivet, interruptions, quizzes, and play views.`
          : "No friction patterns crossed thresholds yet.",
    },
  ]
}

export function linesForProofPage(model: ProofOfTransferView): RouteFetchLine[] {
  if (model.source === "live") {
    return [{ label: "Execution proof", status: "ok", detail: "Proof view built from workspace." }]
  }
  return [
    {
      label: "Execution proof",
      status: "empty",
      detail: "No workspace linked—headline and columns use unlinked copy only.",
      missing: ["business"],
      suggestedFix: "Link a business in Settings, then reload this page.",
    },
  ]
}

export function lineForWorkspaceLinked(hasBusiness: boolean): RouteFetchLine {
  if (hasBusiness) {
    return { label: "Workspace", status: "ok", detail: "Business row resolved for current user." }
  }
  return {
    label: "Workspace",
    status: "empty",
    detail: "No business linked for this session.",
    missing: ["business"],
    suggestedFix: "Open Settings and connect a business before using this module.",
  }
}

export function linesForQueryResult(label: string, result: { ok: true; empty?: boolean; detail?: string } | { ok: false; error: unknown }): RouteFetchLine[] {
  if (result.ok) {
    return [
      {
        label,
        status: result.empty ? "empty" : "ok",
        detail: result.detail,
      },
    ]
  }
  const msg = result.error instanceof Error ? result.error.message : String(result.error)
  return [
    {
      label,
      status: "error",
      detail: msg,
      suggestedFix: suggestedFixFromUnknown(result.error),
    },
  ]
}
