import type { Tables } from "@/types/database"

type ImpactCandidate = { text: string; weight: number }

type SopImpactInput = Pick<
  Tables<"standards">,
  "category" | "importance_level" | "owner_dependency_level" | "status"
>

const CATEGORY_IMPACTS: Record<string, string[]> = {
  opening: [
    "Line speed drops",
    "More gets routed back to you",
    "Team improvises standards",
    "Open checks get skipped under rush",
  ],
  closing: [
    "Secure-out steps get shortcut",
    "Close variance shows up on the next open",
    "Owner called back for cash or alarm issues",
    "Prep for tomorrow starts inconsistent",
  ],
  product_quality: [
    "Remake rate climbs",
    "Guest expectations drift shift to shift",
    "Quality bar becomes whoever is working",
  ],
  quality: [
    "Remake rate climbs",
    "Product spec drifts without a reference",
    "Training sign-offs lose meaning",
  ],
  coffee: [
    "Dial-in and line pace drift",
    "Bar standards vary by who opens",
    "Guest-facing remakes increase",
  ],
  customer_experience: [
    "Recovery calls route to the owner",
    "Complaint handling becomes inconsistent",
    "Service tone varies by shift lead",
  ],
  customer_service: [
    "Hard guest moments escalate to you",
    "Refund boundaries get improvised",
    "Repeat issues never get written down",
  ],
  guest_experience: [
    "Floor experience depends on who is working",
    "Recovery scripts are skipped under pressure",
  ],
  cleaning: [
    "Sanitation gaps surface on inspection or rush",
    "Turnover slows when shortcuts appear",
    "Close-out quality becomes uneven",
  ],
  cash_handling: [
    "Drawer variance rises",
    "End-of-day reconciliation waits on the owner",
    "Cash exceptions lack a paper trail",
  ],
  training: [
    "New hires stall without a sign-off bar",
    "Onboarding weeks produce uneven output",
    "Senior staff re-teach the same gaps",
  ],
  inventory: [
    "Stockouts or over-ordering spike",
    "Par levels drift without a written trigger",
    "Emergency runs pull the owner back in",
  ],
  emergency: [
    "Incidents stall until you arrive",
    "Staff freeze without a written sequence",
    "Safety steps get skipped under pressure",
  ],
  operations: [
    "Mid-shift audits stop happening",
    "Handoffs between roles lose detail",
    "Exceptions pile up untracked",
  ],
  onboarding: [
    "First weeks produce uneven performers",
    "Shadowing replaces measurable readiness",
  ],
  escalation: [
    "Exceptions default to owner judgment",
    "Staff hesitate to act within policy",
  ],
}

const GENERIC_IMPACTS = [
  "Team improvises standards",
  "More gets routed back to you",
  "Rework shows up before anyone logs it",
  "The same questions repeat every shift",
]

function impactsForCategory(category: string): string[] {
  return CATEGORY_IMPACTS[category] ?? GENERIC_IMPACTS
}

function buildImpactCandidates(sop: SopImpactInput): ImpactCandidate[] {
  const base = impactsForCategory(sop.category)
  const candidates: ImpactCandidate[] = base.map((text, index) => ({
    text,
    weight: 92 - index * 3,
  }))

  if (sop.importance_level >= 4) {
    candidates.push({ text: "Critical path stalls when this SOP is absent", weight: 78 })
  }
  if (sop.importance_level >= 5) {
    candidates.push({ text: "Revenue or safety exposure rises within a week", weight: 80 })
  }
  if (sop.owner_dependency_level >= 4) {
    candidates.push({ text: "Work piles on the owner when the routine is not run", weight: 74 })
  }
  if (sop.status === "draft") {
    candidates.push({ text: "Floor runs an older mental model—not this version", weight: 68 })
  }
  if (sop.status === "archived") {
    candidates.push({ text: "Team may still reference an outdated routine", weight: 60 })
  }

  const seen = new Set<string>()
  return candidates
    .sort((a, b) => b.weight - a.weight)
    .filter((c) => {
      if (seen.has(c.text)) return false
      seen.add(c.text)
      return true
    })
}

/** 2–4 business consequences if this SOP is missing or not followed. */
export function computeSopImpactIfMissing(sop: SopImpactInput): string[] {
  const ranked = buildImpactCandidates(sop)
  const count = Math.min(4, Math.max(2, sop.importance_level >= 4 ? 4 : 3))
  return ranked.slice(0, count).map((c) => c.text)
}
