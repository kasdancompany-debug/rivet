"use server"

import { revalidatePath } from "next/cache"

import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { buildAskRivetResponse, trainingModulesForStandard } from "@/lib/ask-rivet/build-response"
import { normalizeAskQuestion } from "@/lib/ask-rivet/normalize-question"
import {
  resolveBestStandardMatch,
  type SearchableStandard,
} from "@/lib/ask-rivet/search-knowledge"
import {
  HIGH_FRICTION_ASK_THRESHOLD,
  type AskRivetResponse,
} from "@/lib/ask-rivet/types"
import { askRivetReviewStatusForConfidence } from "@/lib/ask-rivet/confidence"
import { gateAskRivetResponseForStaff } from "@/lib/ask-rivet/coalesce-response"
import { buildAskRivetIntelligenceDashboard } from "@/lib/ask-rivet/intelligence-dashboard"
import type { AskRivetIntelligenceDashboard } from "@/lib/ask-rivet/intelligence-dashboard"
import { buildQuestionsPreventedMetrics } from "@/lib/ask-rivet/questions-prevented"
import type { QuestionsPreventedMetrics } from "@/lib/ask-rivet/questions-prevented"
import { signStandardMediaRows } from "@/lib/standards/standard-media-server"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/types/database"

export async function askRivetQuestion(payload: {
  question: string
  portal?: boolean
}): Promise<
  | { ok: true; response: AskRivetResponse; signedMedia: Awaited<ReturnType<typeof signStandardMediaRows>> }
  | { ok: false; message: string }
> {
  const question = payload.question.trim()
  if (question.length < 4) {
    return { ok: false, message: "Ask a full question so Rivet can find the right play." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: "Sign in to ask Rivet." }

  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) return { ok: false, message: "Link a workspace first." }

  const { data: member } = await supabase
    .from("business_members")
    .select("id")
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .maybeSingle()

  const isOwner = business.owner_id === user.id
  if (!isOwner && !member) {
    return { ok: false, message: "You do not have access to this workspace." }
  }

  const { data: standards } = await supabase
    .from("standards")
    .select("*, standard_steps(*)")
    .eq("business_id", business.id)
    .eq("status", "active")

  const { data: modules } = await supabase
    .from("training_modules")
    .select("id, title, description, assigned_role")
    .eq("business_id", business.id)

  const { data: trainingItems } = await supabase
    .from("training_items")
    .select("module_id, standard_id")
    .in("standard_id", (standards ?? []).map((s) => s.id))

  const list = (standards ?? []) as unknown as SearchableStandard[]
  const { match: top, moduleMatches } = resolveBestStandardMatch(
    question,
    list,
    modules ?? [],
    trainingItems ?? []
  )
  const standard = top ? list.find((s) => s.id === top.standardId) ?? null : null

  let signedMedia: Awaited<ReturnType<typeof signStandardMediaRows>> = []
  if (standard) {
    const { data: mediaRows } = await supabase
      .from("standard_media")
      .select("*")
      .eq("standard_id", standard.id)
    signedMedia = await signStandardMediaRows(mediaRows ?? [])
  }

  const relatedFromStandard = standard
    ? trainingModulesForStandard(standard.id, modules ?? [], trainingItems ?? [])
    : []

  const relatedFromModules = moduleMatches
    .slice(0, 2)
    .map((m) => ({ id: m.moduleId, title: m.moduleTitle }))
    .filter((m) => !relatedFromStandard.some((r) => r.id === m.id))

  const relatedModules = [...relatedFromStandard, ...relatedFromModules].slice(0, 4)

  const response = buildAskRivetResponse({
    question,
    match: top,
    standard: standard ?? null,
    signedMedia,
    relatedModules,
    portal: payload.portal,
  })

  const staffSafeResponse = gateAskRivetResponseForStaff(response, {
    portal: Boolean(payload.portal),
    isOwner,
  })

  const normalized = normalizeAskQuestion(question)

  await supabase.from("rivet_ask_queries").insert({
    business_id: business.id,
    asked_by: user.id,
    question_text: question.slice(0, 500),
    normalized_question: normalized,
    standard_id: response.standardId,
    matched_source: response.matchedSource,
    response: response as unknown as Json,
    prevented_owner_interrupt: staffSafeResponse.confidence !== "low",
    review_status: askRivetReviewStatusForConfidence(response.confidence),
  })

  await upsertHighFrictionAlert(supabase, business.id, normalized, question, response.standardId)

  revalidatePath("/dashboard")
  revalidatePath("/questions-prevented")
  revalidatePath("/ask")
  revalidatePath("/training")
  if (payload.portal) revalidatePath("/learn/ask")

  return { ok: true, response: staffSafeResponse, signedMedia }
}

async function upsertHighFrictionAlert(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  normalized: string,
  displayQuestion: string,
  standardId: string | null
) {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { count } = await supabase
    .from("rivet_ask_queries")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("normalized_question", normalized)
    .gte("created_at", weekAgo.toISOString())

  const askCount = count ?? 0
  if (askCount < HIGH_FRICTION_ASK_THRESHOLD) return

  const { data: existing } = await supabase
    .from("rivet_high_friction_procedures")
    .select("id, ask_count")
    .eq("business_id", businessId)
    .eq("normalized_question", normalized)
    .maybeSingle()

  if (existing?.id) {
    await supabase
      .from("rivet_high_friction_procedures")
      .update({
        ask_count: askCount,
        display_question: displayQuestion.slice(0, 280),
        last_asked_at: new Date().toISOString(),
        standard_id: standardId,
        status: "open",
      })
      .eq("id", existing.id)
    return
  }

  await supabase.from("rivet_high_friction_procedures").insert({
    business_id: businessId,
    normalized_question: normalized,
    display_question: displayQuestion.slice(0, 280),
    ask_count: askCount,
    standard_id: standardId,
    status: "open",
  })
}

async function fetchAskQueryRowsForMonth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string
) {
  const monthStart = new Date()
  monthStart.setUTCDate(1)
  monthStart.setUTCHours(0, 0, 0, 0)

  const { data: rows } = await supabase
    .from("rivet_ask_queries")
    .select("question_text, normalized_question, standard_id, prevented_owner_interrupt, response, created_at")
    .eq("business_id", businessId)
    .gte("created_at", monthStart.toISOString())
    .order("created_at", { ascending: false })

  const standardIds = [...new Set((rows ?? []).map((r) => r.standard_id).filter(Boolean))] as string[]

  let standardIdsWithTraining = new Set<string>()
  if (standardIds.length > 0) {
    const { data: items } = await supabase
      .from("training_items")
      .select("standard_id")
      .in("standard_id", standardIds)
    standardIdsWithTraining = new Set((items ?? []).map((i) => i.standard_id))
  }

  return { rows: rows ?? [], standardIdsWithTraining }
}

async function loadAskMonthData(): Promise<{
  rows: Awaited<ReturnType<typeof fetchAskQueryRowsForMonth>>["rows"]
  standardIdsWithTraining: Set<string>
} | null> {
  const supabase = await createClient()
  const business = await fetchBusinessForCurrentUser(supabase)
  if (!business) return null
  return fetchAskQueryRowsForMonth(supabase, business.id)
}

export async function getAskRivetIntelligenceDashboard(): Promise<AskRivetIntelligenceDashboard | null> {
  const data = await loadAskMonthData()
  if (!data) return null
  return buildAskRivetIntelligenceDashboard(data.rows, data.standardIdsWithTraining)
}

export async function getQuestionsPreventedMetrics(): Promise<QuestionsPreventedMetrics | null> {
  const data = await loadAskMonthData()
  if (!data) return null
  return buildQuestionsPreventedMetrics(data.rows, data.standardIdsWithTraining)
}

/** @deprecated Use getQuestionsPreventedMetrics */
export async function getAskRivetDashboardMetrics(): Promise<QuestionsPreventedMetrics | null> {
  return getQuestionsPreventedMetrics()
}

export async function acknowledgeHighFrictionAlert(
  alertId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("rivet_high_friction_procedures")
    .update({ status: "acknowledged" })
    .eq("id", alertId)
  if (error) return { ok: false, message: error.message }
  revalidatePath("/dashboard")
  revalidatePath("/ask")
  return { ok: true }
}
