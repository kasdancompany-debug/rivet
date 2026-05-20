"use server"

import { createClient } from "@/lib/supabase/server"
import { answersToScanLeadRow, validateScanAnswersForLead } from "@/lib/operational-scan/scan-lead-payload"
import { computeOperationalScanScores, type OperationalScanAnswers } from "@/lib/operational-scan/score"

const CONFIG_MSG =
  "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, apply migrations (see supabase/migrations), then restart the dev server."

export type SubmitScanLeadResult =
  | { ok: true }
  | { ok: false; error: string; code?: "validation" | "config" | "database" }

export async function submitScanLead(answers: OperationalScanAnswers): Promise<SubmitScanLeadResult> {
  const validationError = validateScanAnswersForLead(answers)
  if (validationError) {
    return { ok: false, error: validationError.message, code: "validation" }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) {
    return { ok: false, error: CONFIG_MSG, code: "config" }
  }

  const supabase = await createClient()

  const result = computeOperationalScanScores(answers)
  const row = answersToScanLeadRow(answers, result)

  const { error } = await supabase.from("scan_leads").insert(row)

  if (error) {
    return {
      ok: false,
      error: "Could not save your scan. Try again in a moment, or email us if this persists.",
      code: "database",
    }
  }

  return { ok: true }
}
