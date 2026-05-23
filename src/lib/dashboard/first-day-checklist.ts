import { FOUNDATION_SOP_COUNT } from "@/lib/industry-templates/bundles/foundation"
import { isRivetIndustryTemplateId } from "@/lib/industry-templates"
import { INSTALLED_TEMPLATE_FOOTER } from "@/lib/sop-templates/installed-copy"
import type { Tables } from "@/types/database"

export type FirstDayChecklistItemId =
  | "industry"
  | "templates"
  | "procedure"
  | "interruption"
  | "team"
  | "escape"

export type FirstDayChecklistItem = {
  id: FirstDayChecklistItemId
  label: string
  detail: string
  href: string
  done: boolean
  /** Shown when the product does not fully automate this step (e.g. team linking). */
  optional?: boolean
}

export type FirstDayChecklistView = {
  businessId: string
  items: FirstDayChecklistItem[]
  completedCount: number
  totalCount: number
  allComplete: boolean
  title: string
  subtitle: string
  progressLabel: string
  completionMessage: string
  dismissLabel: string
  /** Escape score is on the overview when non-null; “viewed” is tracked client-side. */
  escapeScore: number | null
}

function isUserAuthoredStandard(standard: Tables<"standards">): boolean {
  const desc = standard.description ?? ""
  if (!desc.includes(INSTALLED_TEMPLATE_FOOTER)) return true
  const cap = standard.standards_capture
  if (cap && typeof cap === "object" && !Array.isArray(cap) && Object.keys(cap as object).length > 0) {
    return true
  }
  return false
}

export function buildFirstDayChecklist(input: {
  businessId: string
  industryTemplateId: string | null
  templateInstalledAt: string | null
  standards: Tables<"standards">[]
  ownerInterruptionCount: number
  teamProfileCount: number
  escapeScore: number | null
}): FirstDayChecklistView {
  const industryPicked =
    input.industryTemplateId != null && isRivetIndustryTemplateId(input.industryTemplateId)
  const templatesInstalled = input.templateInstalledAt != null
  const realProcedure =
    input.standards.some(isUserAuthoredStandard) ||
    input.standards.length > FOUNDATION_SOP_COUNT
  const interruptionLogged = input.ownerInterruptionCount > 0
  const teamLinked = input.teamProfileCount > 1

  const items: FirstDayChecklistItem[] = [
    {
      id: "industry",
      label: "Pick your industry",
      detail: "Choose the vertical that matches your floor.",
      href: "/onboarding",
      done: industryPicked,
    },
    {
      id: "templates",
      label: "Install starter templates",
      detail: "Preload SOPs, training modules, and workflows you can edit.",
      href: industryPicked ? "/onboarding" : "/onboarding",
      done: templatesInstalled,
    },
    {
      id: "procedure",
      label: "Add one real procedure",
      detail: "Capture how work actually runs—not only the starter pack.",
      href: "/sops/capture",
      done: realProcedure,
    },
    {
      id: "interruption",
      label: "Log one owner interruption",
      detail: "One text, call, or walk-up—so Rivet can measure load.",
      href: "/interruptions",
      done: interruptionLogged,
    },
    {
      id: "team",
      label: "Invite or add one team member",
      detail: "Optional when you have teammates—link profiles in Settings.",
      href: "/settings",
      done: teamLinked,
      optional: true,
    },
    {
      id: "escape",
      label: "View Escape Readiness score",
      detail: "See whether five days away is plausible from your numbers.",
      href: "/dashboard#first-day-escape",
      done: false,
    },
  ]

  const completedCount = items.filter((i) => i.done).length
  const totalCount = items.length
  /** Optional steps (e.g. team) do not block completion. Escape “viewed” is completed client-side. */
  const allComplete = items.every((i) => i.optional || i.done)

  return {
    businessId: input.businessId,
    items,
    completedCount,
    totalCount,
    allComplete,
    title: "First-day checklist",
    subtitle: "About 15 minutes to get real value from Rivet—then dismiss this when you are done.",
    progressLabel: `${completedCount} of ${totalCount} complete`,
    completionMessage:
      "Rivet is installed. Your business is now easier to run without everything going through you.",
    dismissLabel: "Dismiss checklist",
    escapeScore: input.escapeScore,
  }
}

export function firstDayChecklistDismissStorageKey(businessId: string): string {
  return `rivet.first-day-checklist.dismissed.${businessId}`
}

export function firstDayEscapeViewedStorageKey(businessId: string): string {
  return `rivet.first-day-escape-viewed.${businessId}`
}
