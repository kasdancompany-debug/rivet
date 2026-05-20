import type { IndustryTemplateBundle, RivetIndustryTemplateId } from "@/lib/industry-templates/types"
import { getIndustryPack } from "@/lib/sop-templates/industries"

import { interruptionSet, issueSet, trainingSet } from "./_shared"

const CAFE_SOP_IDS = [
  "ind-cafe-opening-run",
  "ind-cafe-closing-secure",
  "ind-cafe-quality-line",
  "ind-cafe-guest-recovery",
  "ind-cafe-shift-zero-to-one",
  "ind-cafe-incident-escalation",
  "ind-cafe-roles-bench",
  "ind-cafe-midshift-ops-audit",
  "ind-cafe-86-menu-sync",
  "ind-cafe-equipment-down",
  "ind-cafe-vendor-delivery",
  "ind-cafe-catering-handoff",
] as const

const CLEANING_SOP_IDS = [
  "ind-clean-opening-dispatch",
  "ind-clean-closing-van",
  "ind-clean-quality-signoff",
  "ind-clean-client-touchpoints",
  "ind-clean-first-week-tech",
  "ind-clean-escalation-ladder",
  "ind-clean-roles-crews",
  "ind-clean-site-exit-checklist",
  "ind-clean-supply-restock",
  "ind-clean-key-audit",
  "ind-clean-weather-delay",
  "ind-clean-new-site-walk",
] as const

const SALON_SOP_IDS = [
  "ind-salon-opening-books",
  "ind-salon-closing-cashout",
  "ind-salon-sanitation-chemical",
  "ind-salon-guest-boundaries",
  "ind-salon-assistant-first-two-weeks",
  "ind-salon-escalation-recovery",
  "ind-salon-level-expectations",
  "ind-salon-midday-floor-reset",
  "ind-salon-double-book",
  "ind-salon-color-formula",
  "ind-salon-retail-pitch",
  "ind-salon-late-guest",
] as const

const RETAIL_SOP_IDS = [
  "ind-retail-store-open",
  "ind-retail-store-close",
  "ind-retail-floor-quality",
  "ind-retail-service-floor",
  "ind-retail-hire-week-one",
  "ind-retail-escalation-lp",
  "ind-retail-role-expectations",
  "ind-retail-zone-recovery",
  "ind-retail-price-override",
  "ind-retail-shipment-receive",
  "ind-retail-fitting-room",
  "ind-retail-bopis",
] as const

const SERVICE_SOP_IDS = [
  "ind-svc-day-start",
  "ind-svc-day-end",
  "ind-svc-deliverable-qa",
  "ind-svc-client-comms",
  "ind-svc-shadow-week",
  "ind-svc-escalation-scope",
  "ind-svc-role-lead-tech",
  "ind-svc-truck-tool-readiness",
  "ind-svc-parts-run",
  "ind-svc-no-access",
  "ind-svc-warranty-call",
  "ind-svc-safety-stop",
] as const

const CONTRACTOR_SOP_IDS = [
  "ind-contract-site-start",
  "ind-contract-site-secure",
  "ind-contract-workmanship-qa",
  "ind-contract-homeowner-comms",
  "ind-contract-probation-week",
  "ind-contract-escalation-rfi",
  "ind-contract-roles-crew",
  "ind-contract-eod-site-audit",
  "ind-contract-weather-stop",
  "ind-contract-material-shortage",
  "ind-contract-change-order",
  "ind-contract-sub-vendor",
] as const

export const INDUSTRY_TEMPLATE_BUNDLES: IndustryTemplateBundle[] = [
  {
    id: "cafe",
    sopPackId: "cafes",
    sopTemplateIds: CAFE_SOP_IDS,
    trainingModules: trainingSet({
      openId: "ind-cafe-opening-run",
      closeId: "ind-cafe-closing-secure",
      qualityId: "ind-cafe-quality-line",
      onboardingId: "ind-cafe-shift-zero-to-one",
      openTitle: "Cafe opening bar readiness",
    }),
    interruptionWorkflows: interruptionSet("Cafe"),
    issueWorkflows: issueSet("Cafe"),
  },
  {
    id: "restaurant",
    sopPackId: "restaurant",
    sopTemplateIds: getIndustryPack("restaurant")!.templateIds,
    trainingModules: trainingSet({
      openId: "ind-restaurant-opening",
      closeId: "ind-restaurant-closing",
      qualityId: "ind-restaurant-dining-quality",
      onboardingId: "ind-restaurant-server-week-one",
      openTitle: "Restaurant opening — FOH & BOH",
    }),
    interruptionWorkflows: interruptionSet("Restaurant"),
    issueWorkflows: issueSet("Restaurant"),
  },
  {
    id: "cleaning",
    sopPackId: "cleaning",
    sopTemplateIds: CLEANING_SOP_IDS,
    trainingModules: trainingSet({
      openId: "ind-clean-opening-dispatch",
      closeId: "ind-clean-closing-van",
      qualityId: "ind-clean-quality-signoff",
      onboardingId: "ind-clean-first-week-tech",
      openTitle: "Route dispatch & van launch",
    }),
    interruptionWorkflows: interruptionSet("Cleaning"),
    issueWorkflows: issueSet("Cleaning"),
  },
  {
    id: "contractor",
    sopPackId: "contractors",
    sopTemplateIds: CONTRACTOR_SOP_IDS,
    trainingModules: trainingSet({
      openId: "ind-contract-site-start",
      closeId: "ind-contract-site-secure",
      qualityId: "ind-contract-workmanship-qa",
      onboardingId: "ind-contract-probation-week",
      openTitle: "Site start & safety",
    }),
    interruptionWorkflows: interruptionSet("Contractor"),
    issueWorkflows: issueSet("Contractor"),
  },
  {
    id: "auto_dealership",
    sopPackId: "auto_dealership",
    sopTemplateIds: getIndustryPack("auto_dealership")!.templateIds,
    trainingModules: trainingSet({
      openId: "ind-auto-opening",
      closeId: "ind-auto-closing",
      qualityId: "ind-auto-test-drive",
      onboardingId: "ind-auto-bdc-followup",
      openTitle: "Dealership open — lot & showroom",
    }),
    interruptionWorkflows: interruptionSet("Dealership"),
    issueWorkflows: issueSet("Dealership"),
  },
  {
    id: "salon",
    sopPackId: "salons",
    sopTemplateIds: SALON_SOP_IDS,
    trainingModules: trainingSet({
      openId: "ind-salon-opening-books",
      closeId: "ind-salon-closing-cashout",
      qualityId: "ind-salon-sanitation-chemical",
      onboardingId: "ind-salon-assistant-first-two-weeks",
      openTitle: "Salon open — books & floor",
    }),
    interruptionWorkflows: interruptionSet("Salon"),
    issueWorkflows: issueSet("Salon"),
  },
  {
    id: "retail",
    sopPackId: "retail",
    sopTemplateIds: RETAIL_SOP_IDS,
    trainingModules: trainingSet({
      openId: "ind-retail-store-open",
      closeId: "ind-retail-store-close",
      qualityId: "ind-retail-floor-quality",
      onboardingId: "ind-retail-hire-week-one",
      openTitle: "Store open — floor ready",
    }),
    interruptionWorkflows: interruptionSet("Retail"),
    issueWorkflows: issueSet("Retail"),
  },
  {
    id: "office",
    sopPackId: "office",
    sopTemplateIds: getIndustryPack("office")!.templateIds,
    trainingModules: trainingSet({
      openId: "ind-office-day-open",
      closeId: "ind-office-day-close",
      qualityId: "ind-office-deliverable-qa",
      onboardingId: "ind-office-new-hire",
      openTitle: "Office day start",
    }),
    interruptionWorkflows: interruptionSet("Office"),
    issueWorkflows: issueSet("Office"),
  },
]

export function getIndustryTemplateBundle(id: RivetIndustryTemplateId): IndustryTemplateBundle | undefined {
  return INDUSTRY_TEMPLATE_BUNDLES.find((b) => b.id === id)
}

export function isRivetIndustryTemplateId(v: string): v is RivetIndustryTemplateId {
  return INDUSTRY_TEMPLATE_BUNDLES.some((b) => b.id === v)
}
