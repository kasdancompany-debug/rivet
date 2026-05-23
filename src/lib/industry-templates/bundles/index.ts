import type { IndustryTemplateBundle, RivetIndustryTemplateId } from "@/lib/industry-templates/types"
import type { IndustryId } from "@/lib/sop-templates/types"
import { getIndustryPack } from "@/lib/sop-templates/industries"

import { interruptionSet, issueSet, trainingSet } from "./_shared"
import { foundationSopIds } from "./foundation"

function packSops(packId: IndustryId): readonly string[] {
  const pack = getIndustryPack(packId)
  if (!pack) {
    throw new Error(`Missing industry pack: ${packId}`)
  }
  return foundationSopIds(pack.templateIds)
}

function bundle(
  id: RivetIndustryTemplateId,
  sopPackId: IndustryId,
  verticalLabel: string,
  training: {
    openId: string
    closeId: string
    qualityId: string
    openTitle?: string
    closeTitle?: string
  }
): IndustryTemplateBundle {
  const ids = packSops(sopPackId)
  return {
    id,
    sopPackId,
    sopTemplateIds: ids,
    trainingModules: trainingSet(training),
    interruptionWorkflows: interruptionSet(verticalLabel),
    issueWorkflows: issueSet(verticalLabel),
  }
}

export const INDUSTRY_TEMPLATE_BUNDLES: IndustryTemplateBundle[] = [
  bundle("cafe", "cafes", "Cafe", {
    openId: "ind-cafe-opening-run",
    closeId: "ind-cafe-closing-secure",
    qualityId: "ind-cafe-quality-line",
    openTitle: "Cafe opening bar readiness",
  }),
  bundle("restaurant", "restaurant", "Restaurant", {
    openId: "ind-restaurant-opening",
    closeId: "ind-restaurant-closing",
    qualityId: "ind-restaurant-dining-quality",
    openTitle: "Restaurant opening — FOH & BOH",
  }),
  bundle("cleaning", "cleaning", "Cleaning", {
    openId: "ind-clean-opening-dispatch",
    closeId: "ind-clean-closing-van",
    qualityId: "ind-clean-quality-signoff",
    openTitle: "Route dispatch & van launch",
  }),
  bundle("contractor", "contractors", "Contractor", {
    openId: "ind-contract-site-start",
    closeId: "ind-contract-site-secure",
    qualityId: "ind-contract-workmanship-qa",
    openTitle: "Site start & safety",
  }),
  bundle("auto_dealership", "auto_dealership", "Dealership", {
    openId: "ind-auto-opening",
    closeId: "ind-auto-closing",
    qualityId: "ind-auto-test-drive",
    openTitle: "Dealership open — lot & showroom",
  }),
  bundle("salon", "salons", "Salon", {
    openId: "ind-salon-opening-books",
    closeId: "ind-salon-closing-cashout",
    qualityId: "ind-salon-sanitation-chemical",
    openTitle: "Salon open — books & floor",
  }),
  bundle("retail", "retail", "Retail", {
    openId: "ind-retail-store-open",
    closeId: "ind-retail-store-close",
    qualityId: "ind-retail-floor-quality",
    openTitle: "Store open — floor ready",
  }),
  bundle("office", "office", "Office", {
    openId: "ind-office-day-open",
    closeId: "ind-office-day-close",
    qualityId: "ind-office-deliverable-qa",
    openTitle: "Office day start",
  }),
]

function assertFoundationBundles() {
  for (const b of INDUSTRY_TEMPLATE_BUNDLES) {
    if (b.sopTemplateIds.length !== 5) {
      throw new Error(`Bundle ${b.id}: expected 5 SOPs, got ${b.sopTemplateIds.length}`)
    }
    if (b.trainingModules.length !== 3) {
      throw new Error(`Bundle ${b.id}: expected 3 training modules, got ${b.trainingModules.length}`)
    }
    if (b.interruptionWorkflows.length !== 5) {
      throw new Error(`Bundle ${b.id}: expected 5 interruptions, got ${b.interruptionWorkflows.length}`)
    }
    if (b.issueWorkflows.length !== 3) {
      throw new Error(`Bundle ${b.id}: expected 3 issue workflows, got ${b.issueWorkflows.length}`)
    }
  }
}

assertFoundationBundles()

export function getIndustryTemplateBundle(id: RivetIndustryTemplateId): IndustryTemplateBundle | undefined {
  return INDUSTRY_TEMPLATE_BUNDLES.find((b) => b.id === id)
}

export function isRivetIndustryTemplateId(v: string): v is RivetIndustryTemplateId {
  return INDUSTRY_TEMPLATE_BUNDLES.some((b) => b.id === v)
}
