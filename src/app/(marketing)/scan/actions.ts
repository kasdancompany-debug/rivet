"use server"

import { getPublicOriginForRequest } from "@/lib/site-public-url"
import { createClient } from "@/lib/supabase/server"
import {
  persistAndSendScanReport,
  resendScanReportByPublicId,
} from "@/lib/operational-scan/scan-report-service"
import type { OperationalScanAnswers } from "@/lib/operational-scan/score"

const CONFIG_MSG =
  "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, apply migrations (see supabase/migrations), then restart the dev server."

export type SubmitScanLeadResult =
  | { ok: true; publicId: string; reportUrl: string }
  | { ok: false; error: string; code?: "validation" | "config" | "database" | "email"; publicId?: string; reportUrl?: string }

export type ResendScanReportResult = SubmitScanLeadResult

export async function submitScanLead(
  answers: OperationalScanAnswers,
  generatedAtIso?: string
): Promise<SubmitScanLeadResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) {
    return { ok: false, error: CONFIG_MSG, code: "config" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const origin = await getPublicOriginForRequest()
  const generatedAt = generatedAtIso ? new Date(generatedAtIso) : new Date()

  const result = await persistAndSendScanReport(answers, {
    userId: user?.id ?? null,
    origin,
    generatedAt,
  })

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      code: result.code,
      publicId: result.publicId,
      reportUrl: result.reportUrl,
    }
  }

  return { ok: true, publicId: result.publicId, reportUrl: result.reportUrl }
}

export async function resendScanReport(publicId: string): Promise<ResendScanReportResult> {
  const origin = await getPublicOriginForRequest()
  const result = await resendScanReportByPublicId(publicId, origin)

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      code: result.code,
      publicId: result.publicId,
      reportUrl: result.reportUrl,
    }
  }

  return { ok: true, publicId: result.publicId, reportUrl: result.reportUrl }
}
