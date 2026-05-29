import { describe, expect, it } from "vitest"

import {
  SCAN_REPORT_MAX_RESEND_ATTEMPTS,
  SCAN_REPORT_RESEND_COOLDOWN_SECONDS,
  scanReportResendBlockedReason,
} from "@/lib/operational-scan/scan-report-resend-limits"

describe("scanReportResendBlockedReason", () => {
  it("blocks when max attempts reached", () => {
    expect(
      scanReportResendBlockedReason({
        retryCount: SCAN_REPORT_MAX_RESEND_ATTEMPTS,
        lastSendAttemptAt: null,
      })
    ).toMatch(/maximum number of resend attempts/)
  })

  it("blocks during cooldown after a recent attempt", () => {
    const now = new Date("2026-05-25T12:00:30Z")
    const last = new Date("2026-05-25T12:00:00Z").toISOString()
    expect(
      scanReportResendBlockedReason({
        retryCount: 1,
        lastSendAttemptAt: last,
        now,
      })
    ).toMatch(/Please wait/)
  })

  it("allows resend after cooldown", () => {
    const now = new Date("2026-05-25T12:02:00Z")
    const last = new Date("2026-05-25T12:00:00Z").toISOString()
    expect(
      scanReportResendBlockedReason({
        retryCount: 1,
        lastSendAttemptAt: last,
        now,
      })
    ).toBeNull()
  })

  it("allows first resend when never attempted", () => {
    expect(
      scanReportResendBlockedReason({
        retryCount: 0,
        lastSendAttemptAt: null,
      })
    ).toBeNull()
  })

  it("uses configured cooldown window", () => {
    expect(SCAN_REPORT_RESEND_COOLDOWN_SECONDS).toBeGreaterThanOrEqual(60)
  })
})
