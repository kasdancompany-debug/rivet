import type { OperationalScanAnswers, OperationalScanResult } from "@/lib/operational-scan/score"

export type ScanReportEmailStatus = "pending" | "sending" | "sent" | "failed"

export type ScanReportDeliveryLogEntry = {
  at: string
  status: "queued" | "sent" | "failed"
  provider: "resend" | "mock"
  attempt: number
  providerMessageId?: string
  error?: string
}

export type StoredScanReportPayload = {
  version: "v3"
  generatedAt: string
  answers: OperationalScanAnswers
  result: OperationalScanResult
  fixes: [string, string, string]
}

export function buildStoredScanReportPayload(
  answers: OperationalScanAnswers,
  result: OperationalScanResult,
  fixes: [string, string, string],
  generatedAt: Date = new Date()
): StoredScanReportPayload {
  return {
    version: "v3",
    generatedAt: generatedAt.toISOString(),
    answers,
    result,
    fixes,
  }
}
