import { Resend } from "resend"

import { buildScanReportPdf } from "@/lib/operational-scan/build-scan-report-pdf"
import type {
  ScanReportDeliveryLogEntry,
  StoredScanReportPayload,
} from "@/lib/operational-scan/scan-report-types"
import { scanReportPublicUrl } from "@/lib/operational-scan/scan-report-url"
import { formatCurrencyCad, formatSeverityLabel } from "@/lib/operational-scan/score"

const MAX_ATTEMPTS = 3
const RETRY_DELAYS_MS = [0, 800, 2000]

export type SendScanReportEmailInput = {
  to: string
  firstName: string
  publicId: string
  payload: StoredScanReportPayload
  origin?: string
}

export type SendScanReportEmailResult = {
  ok: boolean
  provider: "resend" | "mock"
  providerMessageId?: string
  deliveryLog: ScanReportDeliveryLogEntry[]
  error?: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildEmailHtml(input: SendScanReportEmailInput, reportUrl: string): string {
  const { firstName, payload } = input
  const { result, fixes } = payload
  const greeting = firstName.trim() ? `Hi ${firstName.trim()},` : "Hi,"

  const fixItems = fixes.map((f) => `<li style="margin:0 0 8px">${f}</li>`).join("")

  return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#18181b;max-width:560px;margin:0 auto;padding:24px">
  <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#71717a">Rivet scan report</p>
  <p>${greeting}</p>
  <p>Your Owner Dependency Risk report is ready.</p>
  <p style="font-size:32px;font-weight:600;margin:16px 0">${result.ownerDependencyScore}<span style="font-size:16px;color:#71717a">/100</span></p>
  <p><strong>Risk level:</strong> ${formatSeverityLabel(result.severity)}</p>
  <p><strong>Est. annual cost:</strong> ${formatCurrencyCad(result.estimatedAnnualCost)}</p>
  <p style="margin:24px 0"><a href="${reportUrl}" style="display:inline-block;background:#18181b;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">View your report online</a></p>
  <p style="font-size:13px;color:#52525b">Your PDF summary is attached. Save the link to re-run or share later.</p>
  <p style="font-size:13px;font-weight:600;margin-top:24px">Your top three fixes</p>
  <ol style="padding-left:20px;font-size:14px">${fixItems}</ol>
  <p style="font-size:12px;color:#a1a1aa;margin-top:32px">Directional model from your answers · <a href="${reportUrl}">${reportUrl}</a></p>
</body>
</html>`
}

async function sendOnce(
  input: SendScanReportEmailInput,
  attempt: number
): Promise<{ ok: true; providerMessageId: string; provider: "resend" | "mock" } | { ok: false; error: string; provider: "resend" | "mock" }> {
  const reportUrl = scanReportPublicUrl(input.publicId, input.origin)
  const pdfBytes = await buildScanReportPdf(input.payload)
  const business =
    input.payload.answers.businessName.trim() ||
    `${input.payload.answers.firstName.trim()}'s business`
  const subject = `Your Owner Dependency Report — ${business}`
  const html = buildEmailHtml(input, reportUrl)

  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.RESEND_FROM_EMAIL?.trim() ?? "Rivet Reports <reports@rivet.app>"

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, error: "RESEND_API_KEY is not configured.", provider: "mock" }
    }
    return { ok: true, providerMessageId: `mock-${input.publicId}-${attempt}`, provider: "mock" }
  }

  const resend = new Resend(apiKey)
  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject,
    html,
    attachments: [
      {
        filename: "rivet-owner-dependency-report.pdf",
        content: Buffer.from(pdfBytes).toString("base64"),
      },
    ],
  })

  if (error) {
    return { ok: false, error: error.message, provider: "resend" }
  }

  return { ok: true, providerMessageId: data?.id ?? "unknown", provider: "resend" }
}

export async function sendScanReportEmailWithRetry(
  input: SendScanReportEmailInput
): Promise<SendScanReportEmailResult> {
  const deliveryLog: ScanReportDeliveryLogEntry[] = []
  let lastError: string | undefined

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const delay = RETRY_DELAYS_MS[attempt - 1] ?? 0
    if (delay > 0) await sleep(delay)

    deliveryLog.push({
      at: new Date().toISOString(),
      status: "queued",
      provider: process.env.RESEND_API_KEY?.trim() ? "resend" : "mock",
      attempt,
    })

    try {
      const result = await sendOnce(input, attempt)
      if (result.ok) {
        deliveryLog.push({
          at: new Date().toISOString(),
          status: "sent",
          provider: result.provider,
          attempt,
          providerMessageId: result.providerMessageId,
        })
        return {
          ok: true,
          provider: result.provider,
          providerMessageId: result.providerMessageId,
          deliveryLog,
        }
      }
      lastError = result.error
      deliveryLog.push({
        at: new Date().toISOString(),
        status: "failed",
        provider: result.provider,
        attempt,
        error: result.error,
      })
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown send error"
      deliveryLog.push({
        at: new Date().toISOString(),
        status: "failed",
        provider: process.env.RESEND_API_KEY?.trim() ? "resend" : "mock",
        attempt,
        error: lastError,
      })
    }
  }

  return {
    ok: false,
    provider: process.env.RESEND_API_KEY?.trim() ? "resend" : "mock",
    deliveryLog,
    error: lastError ?? "Email delivery failed after retries.",
  }
}
