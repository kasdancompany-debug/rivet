/**
 * Owner Escape Plan — guided intake (stored on `owner_escape_plans.intake_json`).
 */

export const HOURS_OPTIONS = [
  { value: "under_35", label: "Under 35 hrs / week" },
  { value: "35_45", label: "35–45 hrs / week" },
  { value: "46_55", label: "46–55 hrs / week" },
  { value: "56_plus", label: "56+ hrs / week" },
] as const

export const TEAM_SIZE_OPTIONS = [
  { value: "solo", label: "Just me on the floor most days" },
  { value: "2_5", label: "2–5 people" },
  { value: "6_15", label: "6–15 people" },
  { value: "16_plus", label: "16+ people" },
] as const

export const RESPONSIBILITY_CHIPS = [
  "Cash & deposits",
  "Ordering & vendors",
  "Scheduling & coverage",
  "Quality / taste calls",
  "Guest recovery",
  "Equipment breakdowns",
  "Hiring & terminations",
  "Payroll approvals",
  "Marketing & social",
  "Compliance / inspections",
] as const

export const STRESS_CHIPS = [
  "Always on call",
  "No real days off",
  "Fighting fires daily",
  "Team waits on my nod",
  "Quality varies when I'm out",
  "Cash variance worries me",
  "Can't trust closing alone",
] as const

export const CHAOS_CHIPS = [
  "No single source of truth",
  "Checklists ignored",
  "Training is ad hoc",
  "Issues live in texts",
  "Roles overlap / gaps",
  "Peak shifts unravel",
] as const

export const STAFFING_CHIPS = [
  "No named backup for open/close",
  "New hires not signed off",
  "Leads burn out",
  "High turnover lane",
  "Skill depth thin on weekends",
] as const

export const QUALITY_CHIPS = [
  "Remakes / comps creeping",
  "Guest complaints repeat",
  "Inconsistent product",
  "Food safety pressure",
  "Speed vs quality tension",
] as const

export type HoursBand = (typeof HOURS_OPTIONS)[number]["value"]
export type TeamSizeBand = (typeof TEAM_SIZE_OPTIONS)[number]["value"]

export type EscapePlanIntake = {
  hoursBand: HoursBand
  teamSizeBand: TeamSizeBand
  responsibilities: string[]
  stressPoints: string[]
  operationalChaos: string[]
  staffingWeaknesses: string[]
  qualityConcerns: string[]
  ownerNote: string
}

export const defaultEscapePlanIntake = (): EscapePlanIntake => ({
  hoursBand: "46_55",
  teamSizeBand: "2_5",
  responsibilities: [],
  stressPoints: [],
  operationalChaos: [],
  staffingWeaknesses: [],
  qualityConcerns: [],
  ownerNote: "",
})

export function parseEscapePlanIntake(raw: unknown): EscapePlanIntake {
  const d = defaultEscapePlanIntake()
  if (!raw || typeof raw !== "object") return d
  const o = raw as Record<string, unknown>
  const hours = o.hoursBand
  const team = o.teamSizeBand
  const strArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
  return {
    hoursBand: HOURS_OPTIONS.some((h) => h.value === hours) ? (hours as HoursBand) : d.hoursBand,
    teamSizeBand: TEAM_SIZE_OPTIONS.some((t) => t.value === team) ? (team as TeamSizeBand) : d.teamSizeBand,
    responsibilities: strArr(o.responsibilities),
    stressPoints: strArr(o.stressPoints),
    operationalChaos: strArr(o.operationalChaos),
    staffingWeaknesses: strArr(o.staffingWeaknesses),
    qualityConcerns: strArr(o.qualityConcerns),
    ownerNote: typeof o.ownerNote === "string" ? o.ownerNote : "",
  }
}
