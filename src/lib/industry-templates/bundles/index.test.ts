import { describe, expect, it } from "vitest"

import {
  FOUNDATION_INTERRUPTION_COUNT,
  FOUNDATION_ISSUE_COUNT,
  FOUNDATION_SOP_COUNT,
  FOUNDATION_TRAINING_COUNT,
} from "./foundation"
import { INDUSTRY_TEMPLATE_BUNDLES } from "./index"

describe("industry template bundles", () => {
  it("each vertical ships foundation counts for SOPs, training, interruptions, and issues", () => {
    for (const bundle of INDUSTRY_TEMPLATE_BUNDLES) {
      expect(bundle.sopTemplateIds).toHaveLength(FOUNDATION_SOP_COUNT)
      expect(bundle.trainingModules).toHaveLength(FOUNDATION_TRAINING_COUNT)
      expect(bundle.interruptionWorkflows).toHaveLength(FOUNDATION_INTERRUPTION_COUNT)
      expect(bundle.issueWorkflows).toHaveLength(FOUNDATION_ISSUE_COUNT)
    }
  })
})
