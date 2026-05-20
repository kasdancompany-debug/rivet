/**
 * Desktop-only license gate (stub). Web app continues to use Supabase auth + billing.
 * Shell should expose IPC; this module stays a no-op on web.
 *
 * @see docs/architecture/desktop-local-first.md
 */
import { getDeploymentRuntime } from "@/lib/platform/runtime"

export type LicenseGateResult = { ok: true } | { ok: false; reason: string }

/** Call before mutating local-first data on desktop; no-op on web. */
export async function assertLicensedForWrites(): Promise<LicenseGateResult> {
  if (getDeploymentRuntime() === "web") return { ok: true }
  return { ok: false, reason: "Licensing is not wired for this build yet." }
}
