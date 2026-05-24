import type { Tables } from "@/types/database"
import type { TrainingModuleDeep } from "@/lib/db/queries"
import { certificationBadgeLabel } from "@/lib/training/certifications/evaluate"

export type ModuleCertificationView = {
  moduleId: string
  moduleTitle: string
  moduleCompleted: boolean
  quizzesPassed: boolean
  managerSignedOff: boolean
  certified: boolean
  certifiedAt: string | null
}

export type CertificationBadge = {
  moduleId: string
  label: string
  certifiedAt: string
}

export function buildCertificationViews(
  employeeId: string,
  modulesById: Map<string, TrainingModuleDeep>,
  certificationRows: Tables<"employee_module_certifications">[]
): { certifications: ModuleCertificationView[]; certifiedBadges: CertificationBadge[] } {
  const mine = certificationRows.filter((r) => r.employee_id === employeeId)
  const certifications: ModuleCertificationView[] = []
  const certifiedBadges: CertificationBadge[] = []

  for (const row of mine) {
    const mod = modulesById.get(row.training_module_id)
    const title = mod?.title ?? "Training module"
    const view: ModuleCertificationView = {
      moduleId: row.training_module_id,
      moduleTitle: title,
      moduleCompleted: Boolean(row.module_completed_at),
      quizzesPassed: Boolean(row.quizzes_passed_at),
      managerSignedOff: Boolean(row.manager_signed_off_at),
      certified: Boolean(row.certified_at),
      certifiedAt: row.certified_at,
    }
    certifications.push(view)
    if (row.certified_at) {
      certifiedBadges.push({
        moduleId: row.training_module_id,
        label: certificationBadgeLabel(title),
        certifiedAt: row.certified_at,
      })
    }
  }

  certifiedBadges.sort(
    (a, b) => new Date(b.certifiedAt).getTime() - new Date(a.certifiedAt).getTime()
  )

  return { certifications, certifiedBadges }
}
