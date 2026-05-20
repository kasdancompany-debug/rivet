import type { IndustryId } from "../types"

export type IndustryPackMeta = {
  id: IndustryId
  name: string
  tagline: string
  description: string
  /** Canonical order: opening, closing, quality, guest, onboarding, escalation, roles, ops checklist. */
  templateIds: readonly string[]
}

export const INDUSTRY_PACKS: IndustryPackMeta[] = [
  {
    id: "cafes",
    name: "Cafes",
    tagline: "First guest through the door should hit a dialed bar—not a scramble.",
    description:
      "Covers open/close, line quality, guest recovery, first-shift onboarding, when to pull you in, role clarity, and a mid-shift ops pass.",
    templateIds: [
      "ind-cafe-opening-run",
      "ind-cafe-closing-secure",
      "ind-cafe-quality-line",
      "ind-cafe-guest-recovery",
      "ind-cafe-shift-zero-to-one",
      "ind-cafe-incident-escalation",
      "ind-cafe-roles-bench",
      "ind-cafe-midshift-ops-audit",
    ],
  },
  {
    id: "cleaning",
    name: "Cleaning businesses",
    tagline: "Route density, chemicals, and keys—without the owner as dispatch.",
    description:
      "Job packs, quality sign-off, client comms, new tech first week, damage/complaint ladder, crew leads, and van reset.",
    templateIds: [
      "ind-clean-opening-dispatch",
      "ind-clean-closing-van",
      "ind-clean-quality-signoff",
      "ind-clean-client-touchpoints",
      "ind-clean-first-week-tech",
      "ind-clean-escalation-ladder",
      "ind-clean-roles-crews",
      "ind-clean-site-exit-checklist",
    ],
  },
  {
    id: "bakeries",
    name: "Bakeries",
    tagline: "Proof windows, bake schedules, and case integrity—before the morning rush.",
    description:
      "Production open, production close, product spec & holds, wholesale counter, apprentice path, food-safety escalation, roles on the bench, and mid-morning case audit.",
    templateIds: [
      "ind-bake-production-open",
      "ind-bake-production-close",
      "ind-bake-quality-holds",
      "ind-bake-wholesale-counter",
      "ind-bake-apprentice-path",
      "ind-bake-safety-escalation",
      "ind-bake-roles-bench",
      "ind-bake-morning-case-audit",
    ],
  },
  {
    id: "salons",
    name: "Salons",
    tagline: "Books, bowls, and boundaries—so stylists own the chair.",
    description:
      "Salon open, cashout close, chemical & sanitation bar, guest expectations, assistant first two weeks, service recovery & injury ladder, level expectations, and mid-day floor reset.",
    templateIds: [
      "ind-salon-opening-books",
      "ind-salon-closing-cashout",
      "ind-salon-sanitation-chemical",
      "ind-salon-guest-boundaries",
      "ind-salon-assistant-first-two-weeks",
      "ind-salon-escalation-recovery",
      "ind-salon-level-expectations",
      "ind-salon-midday-floor-reset",
    ],
  },
  {
    id: "retail",
    name: "Retail stores",
    tagline: "Floor open, shrink discipline, and recovery when traffic spikes.",
    description:
      "Store open, store close, visual & pricing integrity, service on the floor, seasonal hire week one, LP & guest incident ladder, keyholder vs associate, and zone recovery checklist.",
    templateIds: [
      "ind-retail-store-open",
      "ind-retail-store-close",
      "ind-retail-floor-quality",
      "ind-retail-service-floor",
      "ind-retail-hire-week-one",
      "ind-retail-escalation-lp",
      "ind-retail-role-expectations",
      "ind-retail-zone-recovery",
    ],
  },
  {
    id: "service",
    name: "Service businesses",
    tagline: "Dispatch, scope, and proof—so “we’ll circle back” is not the product.",
    description:
      "Day start, day end, deliverable QA, client comms, new hire shadow week, scope creep & complaint ladder, lead vs tech expectations, and truck/tool readiness.",
    templateIds: [
      "ind-svc-day-start",
      "ind-svc-day-end",
      "ind-svc-deliverable-qa",
      "ind-svc-client-comms",
      "ind-svc-shadow-week",
      "ind-svc-escalation-scope",
      "ind-svc-role-lead-tech",
      "ind-svc-truck-tool-readiness",
    ],
  },
  {
    id: "contractors",
    name: "Contractors",
    tagline: "Site safety, change orders, and punch—without you as the only adult in the room.",
    description:
      "Site start, site secure, workmanship standard, homeowner comms, apprentice/probation week, RFI & safety stop-work ladder, foreman vs lead expectations, and end-of-day site audit.",
    templateIds: [
      "ind-contract-site-start",
      "ind-contract-site-secure",
      "ind-contract-workmanship-qa",
      "ind-contract-homeowner-comms",
      "ind-contract-probation-week",
      "ind-contract-escalation-rfi",
      "ind-contract-roles-crew",
      "ind-contract-eod-site-audit",
    ],
  },
  {
    id: "restaurant",
    name: "Restaurants",
    tagline: "FOH and BOH on one spine—covers, kitchen, and recovery without you as expo.",
    description:
      "Full dining pack: open/close, quality, recovery, training, escalation, roles, audits, reservations, temps, bar spills, and takeout handoff.",
    templateIds: [
      "ind-restaurant-opening",
      "ind-restaurant-closing",
      "ind-restaurant-dining-quality",
      "ind-restaurant-guest-recovery",
      "ind-restaurant-server-week-one",
      "ind-restaurant-escalation",
      "ind-restaurant-roles",
      "ind-restaurant-midshift-audit",
      "ind-restaurant-reservation-overflow",
      "ind-restaurant-walk-in-temp",
      "ind-restaurant-bar-spill",
      "ind-restaurant-takeout-handoff",
    ],
  },
  {
    id: "auto_dealership",
    name: "Auto dealerships",
    tagline: "Lot, desk, and service lane—without you appraising every trade.",
    description:
      "Open/close, test drives, appraisals, BDC, service write-up, escalation, roles, lot audit, delivery, parts holds, and compliance.",
    templateIds: [
      "ind-auto-opening",
      "ind-auto-closing",
      "ind-auto-test-drive",
      "ind-auto-trade-appraisal",
      "ind-auto-bdc-followup",
      "ind-auto-service-advisor",
      "ind-auto-escalation",
      "ind-auto-roles",
      "ind-auto-lot-audit",
      "ind-auto-delivery",
      "ind-auto-parts-hold",
      "ind-auto-compliance",
    ],
  },
  {
    id: "office",
    name: "Small office teams",
    tagline: "Client work, handoffs, and approvals—without you in every thread.",
    description:
      "Day open/close, client onboarding, QA, escalation, new hire, meetings, roles, data handling, PTO, invoices, and weekly ops.",
    templateIds: [
      "ind-office-day-open",
      "ind-office-day-close",
      "ind-office-client-onboarding",
      "ind-office-deliverable-qa",
      "ind-office-escalation",
      "ind-office-new-hire",
      "ind-office-meeting-facilitation",
      "ind-office-roles",
      "ind-office-data-handling",
      "ind-office-pto-handoff",
      "ind-office-vendor-invoice",
      "ind-office-weekly-ops",
    ],
  },
]

export function getIndustryPack(id: string): IndustryPackMeta | undefined {
  return INDUSTRY_PACKS.find((p) => p.id === id)
}
