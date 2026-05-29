import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import { mergeOperationalMemoryIntoCapture } from "@/lib/standards-capture/operational-memory-publish"
import { emptyStandardsCapture } from "@/lib/standards-capture/types"
import type { TypedSupabaseClient } from "@/types/database"
import type { Json } from "@/types/database"

export async function appendFaqToPlayOperationalMemory(
  supabase: TypedSupabaseClient,
  standardId: string,
  question: string,
  answer: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const q = question.trim()
  const a = answer.trim()
  if (q.length < 4 || a.length < 8) {
    return { ok: false, message: "Question and answer must be long enough to save." }
  }

  const { data: row, error } = await supabase
    .from("standards")
    .select("standards_capture")
    .eq("id", standardId)
    .maybeSingle()

  if (error || !row) {
    return { ok: false, message: error?.message ?? "Play not found." }
  }

  const capture = parseStandardsCapture(row.standards_capture) ?? emptyStandardsCapture()

  const memory = capture.operationalMemory ?? {
    successLooksLike: "",
    failureLooksLike: "",
    newHireMistakes: [],
    ifNobodyAsks: "",
    goodExampleMediaId: null,
    badExampleMediaId: null,
  }

  const faqs = [...(memory.faqs ?? [])]
  const existing = faqs.findIndex(
    (f) => f.question.trim().toLowerCase() === q.toLowerCase()
  )
  if (existing >= 0) {
    faqs[existing] = { question: q, answer: a }
  } else {
    faqs.push({ question: q, answer: a })
  }

  const merged = mergeOperationalMemoryIntoCapture(capture, {
    ...memory,
    faqs: faqs.slice(-20),
  })

  const { error: updateErr } = await supabase
    .from("standards")
    .update({
      standards_capture: merged as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", standardId)

  if (updateErr) return { ok: false, message: updateErr.message }
  return { ok: true }
}
