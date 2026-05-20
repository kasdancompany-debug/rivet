import { buildOperationsCoachSnapshot } from "@/lib/operations-coach/build-snapshot"
import type { OperationsCoachSnapshot } from "@/lib/operations-coach/types"

/** Empty snapshot shape for coach when no business is linked — no fabricated issues or SOPs. */
export function buildUnlinkedCoachSnapshot(): OperationsCoachSnapshot {
  return buildOperationsCoachSnapshot({
    businessName: "Not linked",
    generatedAt: new Date(),
    assessment: null,
    standards: [],
    stepCountBySopId: new Map(),
    bottlenecks: [],
    modules: [],
    progressForBusiness: [],
    checklists: [],
    runs: [],
  })
}
