import type { ReadinessCapabilityField } from "@/lib/training/compute-readiness"

export type SuccessionRiskLevel = "low" | "medium" | "high" | "critical"

export type SuccessionRoleRow = {
  id: string
  roleLabel: string
  capabilityField: ReadinessCapabilityField | null
  primaryProfileId: string | null
  primaryName: string | null
  backupProfileId: string | null
  backupName: string | null
  riskLevel: SuccessionRiskLevel
  riskReason: string
  notes: string | null
  sortOrder: number
}

export type TeamSuccessionMapView = {
  businessId: string
  businessName: string
  roles: SuccessionRoleRow[]
  teamOptions: { id: string; name: string; role: string }[]
  canEdit: boolean
}
