import { tryCreateAdminClient } from "@/lib/supabase/try-admin-client"
import { buildStoredScanReportPayload } from "@/lib/operational-scan/scan-report-types"
import type {
  ScanReportDeliveryLogEntry,
  ScanReportEmailStatus,
  StoredScanReportPayload,
} from "@/lib/operational-scan/scan-report-types"
import { sendScanReportEmailWithRetry } from "@/lib/operational-scan/send-scan-report-email"
import { scanReportPublicUrl } from "@/lib/operational-scan/scan-report-url"
import { recommendedFirstFixes } from "@/lib/operational-scan/recommended-next-steps"
import {
  computeOperationalScanScores,
  type OperationalScanAnswers,
  type OperationalScanResult,
} from "@/lib/operational-scan/score"
import { answersToScanLeadRow, validateScanAnswersForLead } from "@/lib/operational-scan/scan-lead-payload"
import type { TablesInsert } from "@/types/database"

export type PersistAndSendScanReportResult =
  | {
      ok: true
      publicId: string
      reportUrl: string
      emailStatus: "sent"
    }
  | {
      ok: false
      error: string
      code: "validation" | "config" | "database" | "email"
      publicId?: string
      reportUrl?: string
    }

type ScanReportRow = {
  id: string
  public_id: string
  delivery_log: ScanReportDeliveryLogEntry[]
  retry_count: number
  report_payload: StoredScanReportPayload
  recipient_email: string
  first_name: string
}

function appendDeliveryLog(
  existing: ScanReportDeliveryLogEntry[],
  entries: ScanReportDeliveryLogEntry[]
): ScanReportDeliveryLogEntry[] {
  return [...existing, ...entries]
}

async function updateReportDelivery(
  reportId: string,
  patch: {
    email_status: ScanReportEmailStatus
    email_provider?: string | null
    email_provider_id?: string | null
    delivery_log: ScanReportDeliveryLogEntry[]
    retry_count: number
    last_send_attempt_at: string
    sent_at?: string | null
  }
): Promise<boolean> {
  const admin = tryCreateAdminClient()
  if (!admin) return false

  const { error } = await admin.from("scan_reports").update(patch).eq("id", reportId)
  return !error
}

async function deliverReportEmail(
  row: ScanReportRow,
  origin?: string
): Promise<{ ok: boolean; error?: string }> {
  const attemptAt = new Date().toISOString()
  const nextRetry = row.retry_count + 1

  await updateReportDelivery(row.id, {
    email_status: "sending",
    delivery_log: row.delivery_log,
    retry_count: nextRetry,
    last_send_attempt_at: attemptAt,
  })

  const sendResult = await sendScanReportEmailWithRetry({
    to: row.recipient_email,
    firstName: row.first_name,
    publicId: row.public_id,
    payload: row.report_payload,
    origin,
  })

  const mergedLog = appendDeliveryLog(row.delivery_log, sendResult.deliveryLog)

  if (sendResult.ok) {
    await updateReportDelivery(row.id, {
      email_status: "sent",
      email_provider: sendResult.provider,
      email_provider_id: sendResult.providerMessageId ?? null,
      delivery_log: mergedLog,
      retry_count: nextRetry,
      last_send_attempt_at: attemptAt,
      sent_at: attemptAt,
    })
    return { ok: true }
  }

  await updateReportDelivery(row.id, {
    email_status: "failed",
    email_provider: sendResult.provider,
    delivery_log: mergedLog,
    retry_count: nextRetry,
    last_send_attempt_at: attemptAt,
    sent_at: null,
  })

  return { ok: false, error: sendResult.error }
}

export async function persistAndSendScanReport(
  answers: OperationalScanAnswers,
  options?: { userId?: string | null; origin?: string; generatedAt?: Date }
): Promise<PersistAndSendScanReportResult> {
  const validationError = validateScanAnswersForLead(answers)
  if (validationError) {
    return { ok: false, error: validationError.message, code: "validation" }
  }

  const admin = tryCreateAdminClient()
  if (!admin) {
    return {
      ok: false,
      error: "Report storage is not configured (SUPABASE_SERVICE_ROLE_KEY required).",
      code: "config",
    }
  }

  const result = computeOperationalScanScores(answers)
  const fixes = recommendedFirstFixes(result, answers)
  const generatedAt = options?.generatedAt ?? new Date()
  const payload = buildStoredScanReportPayload(answers, result, fixes, generatedAt)
  const leadRow = answersToScanLeadRow(answers, result) as TablesInsert<"scan_leads">

  const { data: lead, error: leadError } = await admin
    .from("scan_leads")
    .insert(leadRow)
    .select("id")
    .single()

  if (leadError || !lead) {
    return {
      ok: false,
      error: "Could not save your scan. Try again in a moment.",
      code: "database",
    }
  }

  const reportInsert = {
    user_id: options?.userId ?? null,
    scan_lead_id: lead.id,
    recipient_email: answers.email.trim().toLowerCase(),
    first_name: answers.firstName.trim(),
    report_payload: payload as unknown as Record<string, unknown>,
    email_status: "pending" as const,
  }

  const { data: report, error: reportError } = await admin
    .from("scan_reports")
    .insert(reportInsert)
    .select("id, public_id, delivery_log, retry_count, report_payload, recipient_email, first_name")
    .single()

  if (reportError || !report) {
    return {
      ok: false,
      error: "Could not create your report. Try again in a moment.",
      code: "database",
    }
  }

  const reportUrl = scanReportPublicUrl(report.public_id, options?.origin)
  const row: ScanReportRow = {
    id: report.id,
    public_id: report.public_id,
    delivery_log: (report.delivery_log as ScanReportDeliveryLogEntry[]) ?? [],
    retry_count: report.retry_count,
    report_payload: report.report_payload as StoredScanReportPayload,
    recipient_email: report.recipient_email,
    first_name: report.first_name,
  }

  const delivered = await deliverReportEmail(row, options?.origin)
  if (!delivered.ok) {
    return {
      ok: false,
      error: delivered.error ?? "Could not send your report email. Try resend below.",
      code: "email",
      publicId: report.public_id,
      reportUrl,
    }
  }

  return { ok: true, publicId: report.public_id, reportUrl, emailStatus: "sent" }
}

export async function resendScanReportByPublicId(
  publicId: string,
  origin?: string
): Promise<PersistAndSendScanReportResult> {
  const admin = tryCreateAdminClient()
  if (!admin) {
    return { ok: false, error: "Report resend is not configured.", code: "config" }
  }

  const { data: report, error } = await admin
    .from("scan_reports")
    .select("id, public_id, delivery_log, retry_count, report_payload, recipient_email, first_name")
    .eq("public_id", publicId)
    .maybeSingle()

  if (error || !report) {
    return { ok: false, error: "Report not found.", code: "database" }
  }

  const row: ScanReportRow = {
    id: report.id,
    public_id: report.public_id,
    delivery_log: (report.delivery_log as ScanReportDeliveryLogEntry[]) ?? [],
    retry_count: report.retry_count,
    report_payload: report.report_payload as StoredScanReportPayload,
    recipient_email: report.recipient_email,
    first_name: report.first_name,
  }

  const reportUrl = scanReportPublicUrl(report.public_id, origin)
  const delivered = await deliverReportEmail(row, origin)
  if (!delivered.ok) {
    return {
      ok: false,
      error: delivered.error ?? "Resend failed. Try again shortly.",
      code: "email",
      publicId: report.public_id,
      reportUrl,
    }
  }

  return { ok: true, publicId: report.public_id, reportUrl, emailStatus: "sent" }
}

export async function getScanReportByPublicId(publicId: string): Promise<{
  payload: StoredScanReportPayload
  recipientEmail: string
  firstName: string
  sentAt: string | null
} | null> {
  const admin = tryCreateAdminClient()
  if (!admin) return null

  const { data, error } = await admin
    .from("scan_reports")
    .select("report_payload, recipient_email, first_name, sent_at")
    .eq("public_id", publicId)
    .maybeSingle()

  if (error || !data) return null

  return {
    payload: data.report_payload as StoredScanReportPayload,
    recipientEmail: data.recipient_email,
    firstName: data.first_name,
    sentAt: data.sent_at,
  }
}
