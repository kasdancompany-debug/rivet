"use server"

import { revalidatePath } from "next/cache"

import { appendFaqToPlayOperationalMemory } from "@/lib/ask-rivet/append-play-faq"
import { coalesceAskRivetResponse } from "@/lib/ask-rivet/coalesce-response"
import type { AskRivetResponse } from "@/lib/ask-rivet/types"
import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { createClient } from "@/lib/supabase/server"
import type { AskRivetReviewStatus, Json } from "@/types/database"

export type AskRivetReviewQueueItem = {
  id: string
  questionText: string
  quickAnswer: string
  confidence: AskRivetResponse["confidence"]
  confidenceScore: number
  playTitle: string | null
  standardId: string | null
  standardHref: string | null
  reviewStatus: AskRivetReviewStatus
  createdAt: string
}

function parseResponse(raw: Json): Partial<AskRivetResponse> {
  if (!raw || typeof raw !== "object") return {}
  return raw as Partial<AskRivetResponse>
}

async function requireOwnerBusiness() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, message: "Sign in required." }

  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) return { ok: false as const, message: "Link a workspace first." }
  if (business.owner_id !== user.id) {
    return { ok: false as const, message: "Only the workspace owner can review Ask Rivet answers." }
  }

  return { ok: true as const, supabase, business, userId: user.id }
}

export async function listAskRivetReviewQueue(): Promise<
  { ok: true; items: AskRivetReviewQueueItem[] } | { ok: false; message: string }
> {
  const gate = await requireOwnerBusiness()
  if (!gate.ok) return gate

  const { data, error } = await gate.supabase
    .from("rivet_ask_queries")
    .select("*")
    .eq("business_id", gate.business.id)
    .in("review_status", ["pending", "improved"])
    .order("created_at", { ascending: false })
    .limit(25)

  if (error) return { ok: false, message: error.message }

  const items: AskRivetReviewQueueItem[] = (data ?? []).map((row) => {
    const response = parseResponse(row.response)
    return {
      id: row.id,
      questionText: row.question_text,
      quickAnswer: response.quickAnswer ?? "",
      confidence: response.confidence ?? "low",
      confidenceScore: response.confidenceScore ?? 0,
      playTitle: response.playTitle ?? null,
      standardId: row.standard_id,
      standardHref: response.standardHref ?? (row.standard_id ? `/sops/${row.standard_id}` : null),
      reviewStatus: row.review_status,
      createdAt: row.created_at,
    }
  })

  return { ok: true, items }
}

export async function approveAskRivetQuery(
  queryId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await requireOwnerBusiness()
  if (!gate.ok) return gate

  const now = new Date().toISOString()
  const { error } = await gate.supabase
    .from("rivet_ask_queries")
    .update({
      review_status: "approved",
      reviewed_by: gate.userId,
      reviewed_at: now,
    })
    .eq("id", queryId)
    .eq("business_id", gate.business.id)

  if (error) return { ok: false, message: error.message }

  revalidatePath("/ask")
  return { ok: true }
}

export async function improveAskRivetQuery(payload: {
  queryId: string
  improvedAnswer: string
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await requireOwnerBusiness()
  if (!gate.ok) return gate

  const { data: row, error: fetchErr } = await gate.supabase
    .from("rivet_ask_queries")
    .select("*")
    .eq("id", payload.queryId)
    .eq("business_id", gate.business.id)
    .maybeSingle()

  if (fetchErr || !row) return { ok: false, message: "Ask not found." }

  const improved = payload.improvedAnswer.trim()
  if (improved.length < 8) {
    return { ok: false, message: "Write a complete improved answer (at least 8 characters)." }
  }

  if (row.standard_id) {
    const faq = await appendFaqToPlayOperationalMemory(
      gate.supabase,
      row.standard_id,
      row.question_text,
      improved
    )
    if (!faq.ok) return faq
  }

  const response = parseResponse(row.response)
  const updatedResponse = coalesceAskRivetResponse(response, {
    quickAnswer: improved,
    confidence: "high",
    confidenceScore: Math.max(response.confidenceScore ?? 0, 85),
  })
  if (!updatedResponse) {
    return { ok: false, message: "Stored response is incomplete; ask again from Ask Rivet." }
  }

  const now = new Date().toISOString()
  const { error } = await gate.supabase
    .from("rivet_ask_queries")
    .update({
      review_status: "improved",
      reviewed_by: gate.userId,
      reviewed_at: now,
      owner_improved_answer: improved,
      response: updatedResponse as unknown as Json,
    })
    .eq("id", payload.queryId)

  if (error) return { ok: false, message: error.message }

  revalidatePath("/ask")
  revalidatePath("/learn/ask")
  if (row.standard_id) revalidatePath(`/sops/${row.standard_id}`)
  return { ok: true }
}
