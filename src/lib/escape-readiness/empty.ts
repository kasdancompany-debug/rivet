import { finalizeEscapeReadinessView } from "@/lib/escape-readiness/enrichment"
import type { EscapeReadinessView } from "@/lib/escape-readiness/types"

export function emptyEscapeReadiness(): EscapeReadinessView {
  return finalizeEscapeReadinessView({
    score: null,
    verdict:
      "Link your business and add operating signal—standards, training, and interruptions—so Rivet can score escape readiness.",
    factors: [
      {
        id: "sop_coverage",
        label: "SOP coverage",
        percent: null,
        hint: "Waiting on workspace data.",
      },
      {
        id: "training_coverage",
        label: "Training coverage",
        percent: null,
        hint: "Waiting on workspace data.",
      },
      {
        id: "unresolved_issues",
        label: "Unresolved issues",
        percent: null,
        hint: "Waiting on workspace data.",
      },
      {
        id: "owner_interruptions",
        label: "Owner interruptions",
        percent: null,
        hint: "Waiting on workspace data.",
      },
      {
        id: "undocumented_procedures",
        label: "Undocumented procedures",
        percent: null,
        hint: "Waiting on workspace data.",
      },
    ],
    progress: [],
  })
}
