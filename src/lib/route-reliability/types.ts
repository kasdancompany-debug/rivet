/**
 * Dev diagnostics and route reliability metadata (no production UI).
 */

export type RouteFetchStatus = "ok" | "empty" | "error" | "degraded" | "skipped"

export type RouteFetchLine = {
  /** Short label shown in the dev panel (e.g. "Workspace", "Issues list"). */
  label: string
  status: RouteFetchStatus
  /** Human-readable detail for developers. */
  detail?: string
  /** Tables or record sets that were missing or empty when relevant. */
  missing?: string[]
  suggestedFix?: string
}
