import {
  fetchBusinessForCurrentUser,
  fetchCurrentProfile,
  fetchTrainingModuleDeep,
  listEmployeeModuleCertificationsForEmployeeIds,
  listEmployeeTrainingProgress,
  listTrainingSopCompletionsForEmployeeIds,
} from "@/lib/db/queries"
import { buildCertificationViews } from "@/lib/training/certifications/build-views"
import type { CertificationBadge } from "@/lib/training/certifications/build-views"
import { createClient } from "@/lib/supabase/server"
import type { TrainingProgressStatus } from "@/types/database"

export type PortalTodayModule = {
  moduleId: string
  title: string
  description: string | null
  status: TrainingProgressStatus
  progressPct: number
  itemCount: number
  completedItems: number
}

export type PortalAssignedPlay = {
  standardId: string
  title: string
  moduleId: string
  moduleTitle: string
  estimatedMinutes: number | null
  completed: boolean
}

export type PortalRecentlyCompleted = {
  id: string
  kind: "play" | "module"
  title: string
  subtitle: string | null
  href: string
  completedAt: string
}

export type PortalProgressSummary = {
  overallPct: number
  modulesCompleted: number
  modulesTotal: number
  playsCompleted: number
  playsTotal: number
  certificationsEarned: number
}

export type PortalHomeView = {
  businessName: string
  userName: string
  progress: PortalProgressSummary
  todayModules: PortalTodayModule[]
  certifications: CertificationBadge[]
  pendingCertifications: number
  assignedPlays: PortalAssignedPlay[]
  recentlyCompleted: PortalRecentlyCompleted[]
}

function moduleProgressPct(
  status: TrainingProgressStatus,
  requiredTotal: number,
  completedItems: number
): number {
  if (status === "completed") return 100
  if (requiredTotal === 0) return status === "in_progress" ? 50 : 0
  return Math.round((completedItems / requiredTotal) * 100)
}

function buildRecentlyCompleted(input: {
  completions: { training_item_id: string; completed_at: string }[]
  itemMeta: Map<string, { title: string; moduleTitle: string; standardId: string; moduleId: string }>
  moduleCompletions: { moduleId: string; title: string; completedAt: string }[]
}): PortalRecentlyCompleted[] {
  const rows: PortalRecentlyCompleted[] = []

  for (const c of input.completions) {
    const meta = input.itemMeta.get(c.training_item_id)
    if (!meta || !c.completed_at) continue
    rows.push({
      id: `play-${c.training_item_id}`,
      kind: "play",
      title: meta.title,
      subtitle: meta.moduleTitle,
      href: `/learn/plays/${meta.standardId}`,
      completedAt: c.completed_at,
    })
  }

  for (const m of input.moduleCompletions) {
    rows.push({
      id: `module-${m.moduleId}`,
      kind: "module",
      title: m.title,
      subtitle: "Training module",
      href: `/learn/${m.moduleId}`,
      completedAt: m.completedAt,
    })
  }

  return rows
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 8)
}

export async function loadPortalHomeForEmployee(employeeId: string): Promise<PortalHomeView | null> {
  const supabase = await createClient()
  const [business, profile] = await Promise.all([
    fetchBusinessForCurrentUser(supabase),
    fetchCurrentProfile(supabase),
  ])
  if (!business) return null

  const assignments = await listEmployeeTrainingProgress({ employeeId }, supabase)
  const businessAssignments = assignments.filter((a) => a.business_id === business.id)

  const completions = await listTrainingSopCompletionsForEmployeeIds([employeeId], supabase)
  const completionItemIds = new Set(
    completions.filter((c) => c.employee_id === employeeId).map((c) => c.training_item_id)
  )

  const todayModules: PortalTodayModule[] = []
  const playMap = new Map<string, PortalAssignedPlay>()
  const itemMeta = new Map<
    string,
    { title: string; moduleTitle: string; standardId: string; moduleId: string }
  >()
  const modulesById = new Map<string, NonNullable<Awaited<ReturnType<typeof fetchTrainingModuleDeep>>>>()
  const moduleCompletions: { moduleId: string; title: string; completedAt: string }[] = []

  for (const row of businessAssignments) {
    const mod = await fetchTrainingModuleDeep(row.training_module_id, supabase)
    if (!mod) continue
    modulesById.set(mod.id, mod)

    const requiredItems = (mod.training_items ?? []).filter((i) => i.required)
    const completedItems = requiredItems.filter((i) => completionItemIds.has(i.id)).length
    const progressPct = moduleProgressPct(row.status, requiredItems.length, completedItems)

    todayModules.push({
      moduleId: mod.id,
      title: mod.title,
      description: mod.description,
      status: row.status,
      progressPct,
      itemCount: requiredItems.length,
      completedItems,
    })

    if (row.status === "completed" && row.completed_at) {
      moduleCompletions.push({
        moduleId: mod.id,
        title: mod.title,
        completedAt: row.completed_at,
      })
    }

    for (const item of requiredItems) {
      const title = item.standards?.title?.trim() || "Play"
      itemMeta.set(item.id, {
        title,
        moduleTitle: mod.title,
        standardId: item.standard_id,
        moduleId: mod.id,
      })
      const existing = playMap.get(item.standard_id)
      if (existing) {
        playMap.set(item.standard_id, {
          ...existing,
          completed: existing.completed || completionItemIds.has(item.id),
        })
      } else {
        playMap.set(item.standard_id, {
          standardId: item.standard_id,
          title,
          moduleId: mod.id,
          moduleTitle: mod.title,
          estimatedMinutes: item.standards?.estimated_time_minutes ?? null,
          completed: completionItemIds.has(item.id),
        })
      }
    }
  }

  todayModules.sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1
    if (b.status === "completed" && a.status !== "completed") return -1
    return b.progressPct - a.progressPct
  })

  const assignedPlays = [...playMap.values()].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return a.title.localeCompare(b.title)
  })

  const playsCompleted = assignedPlays.filter((p) => p.completed).length
  const playsTotal = assignedPlays.length
  const modulesCompleted = todayModules.filter((m) => m.status === "completed").length
  const modulesTotal = todayModules.length

  const progressSum = todayModules.reduce((acc, m) => acc + m.progressPct, 0)
  const overallPct =
    modulesTotal > 0 ? Math.round(progressSum / modulesTotal) : playsTotal > 0 ? Math.round((playsCompleted / playsTotal) * 100) : 0

  const certificationRows = await listEmployeeModuleCertificationsForEmployeeIds([employeeId], supabase)
  const { certifiedBadges, certifications } = buildCertificationViews(
    employeeId,
    modulesById,
    certificationRows
  )
  const pendingCertifications = certifications.filter((c) => !c.certified).length

  const recentlyCompleted = buildRecentlyCompleted({
    completions: completions
      .filter((c) => c.employee_id === employeeId && c.completed_at)
      .map((c) => ({ training_item_id: c.training_item_id, completed_at: c.completed_at! })),
    itemMeta,
    moduleCompletions,
  })

  return {
    businessName: business.name,
    userName: profile?.full_name?.trim() || "there",
    progress: {
      overallPct,
      modulesCompleted,
      modulesTotal,
      playsCompleted,
      playsTotal,
      certificationsEarned: certifiedBadges.length,
    },
    todayModules,
    certifications: certifiedBadges,
    pendingCertifications,
    assignedPlays,
    recentlyCompleted,
  }
}

export async function employeeCanAccessStandard(
  employeeId: string,
  standardId: string
): Promise<boolean> {
  const home = await loadPortalHomeForEmployee(employeeId)
  if (!home) return false
  return home.assignedPlays.some((p) => p.standardId === standardId)
}
