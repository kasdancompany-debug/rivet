import { describe, expect, it } from "vitest"

import { INDUSTRY_TEMPLATE_BUNDLES } from "./index"

describe("industry template bundles", () => {
  it("each vertical ships 12 SOPs, 4 training modules, and 7 interruption workflows", () => {
    for (const bundle of INDUSTRY_TEMPLATE_BUNDLES) {
      expect(bundle.sopTemplateIds).toHaveLength(12)
      expect(bundle.trainingModules).toHaveLength(4)
      expect(bundle.interruptionWorkflows).toHaveLength(7)
      expect(bundle.issueWorkflows.length).toBeGreaterThanOrEqual(3)
    }
  })
})
