import { COPY } from "@/lib/interface-copy"
import { finalizeEscapeReadinessView } from "@/lib/escape-readiness/enrichment"
import type { EscapeReadinessView } from "@/lib/escape-readiness/types"
import { PLAY_COVERAGE_LABEL, UNDOCUMENTED_MEMORY_LABEL } from "@/lib/product-voice"

export function emptyEscapeReadiness(): EscapeReadinessView {
  return finalizeEscapeReadinessView({
    score: null,
    verdict:
      "Link your business and add operating signal—plays, training, and what still routes back to you—so Rivet can score step-back readiness.",
    factors: [
      {
        id: "sop_coverage",
        label: PLAY_COVERAGE_LABEL,
        percent: null,
        hint: "Waiting on business data.",
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
        label: COPY.interruptions.featureTitle,
        percent: null,
        hint: "Waiting on business data.",
      },
      {
        id: "undocumented_procedures",
        label: UNDOCUMENTED_MEMORY_LABEL,
        percent: null,
        hint: "Waiting on business data.",
      },
    ],
    progress: [],
  })
}
