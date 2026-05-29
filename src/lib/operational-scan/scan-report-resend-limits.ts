/** Max user-initiated resends per report (excludes initial send). */
export const SCAN_REPORT_MAX_RESEND_ATTEMPTS = 5

/** Minimum seconds between resend attempts for the same report. */
export const SCAN_REPORT_RESEND_COOLDOWN_SECONDS = 60

export type ScanReportResendGateInput = {
  retryCount: number
  lastSendAttemptAt: string | null
  now?: Date
}

export function scanReportResendBlockedReason(
  input: ScanReportResendGateInput
): string | null {
  if (input.retryCount >= SCAN_REPORT_MAX_RESEND_ATTEMPTS) {
    return `You have reached the maximum number of resend attempts (${SCAN_REPORT_MAX_RESEND_ATTEMPTS}). Contact support if you still need your report.`
  }

  if (!input.lastSendAttemptAt) return null

  const lastMs = Date.parse(input.lastSendAttemptAt)
  if (Number.isNaN(lastMs)) return null

  const now = input.now ?? new Date()
  const elapsedSec = (now.getTime() - lastMs) / 1000
  if (elapsedSec < SCAN_REPORT_RESEND_COOLDOWN_SECONDS) {
    const waitSec = Math.ceil(SCAN_REPORT_RESEND_COOLDOWN_SECONDS - elapsedSec)
    return `Please wait ${waitSec} second${waitSec === 1 ? "" : "s"} before requesting another email.`
  }

  return null
}
