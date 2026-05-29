import { MINUTES_SAVED_PER_ASK } from "./types"
import {
  parseStoredAskResponse,
  responseHasMedia,
  suggestFixForRepeatedQuestion,
  type AskRivetFixKind,
} from "./fix-suggestions"

export type AskQueryRow = {
  question_text: string
  normalized_question: string
  standard_id: string | null
  prevented_owner_interrupt: boolean
  response: unknown
  created_at: string
}

export type QuestionCluster = {
  normalizedQuestion: string
  displayQuestion: string
  askCount: number
  preventedCount: number
  lowConfidenceCount: number
  standardId: string | null
  hasMedia: boolean
  lastAskedAt: string
}

export type RepeatedQuestionWithFix = QuestionCluster & {
  fixKind: AskRivetFixKind
  hasTrainingModule: boolean
}

export type StaffQuestionInsight = {
  question: string
  askCount: number
  preventedCount: number
  standardId: string | null
}

export type ConfusionArea = {
  question: string
  askCount: number
  lowConfidenceCount: number
  preventedCount: number
  summary: string
  standardId: string | null
}

export type QuestionsPreventedMetrics = {
  questionsAnsweredThisWeek: number
  questionsAnsweredThisMonth: number
  questionsPreventedThisMonth: number
  interruptionsAvoidedThisMonth: number
  ownerHoursReturnedThisMonth: number
  mostAsked: { question: string; count: number } | null
  topStaffQuestions: StaffQuestionInsight[]
  confusionAreas: ConfusionArea[]
  unverifiedQuestions: { question: string; count: number; lastAskedAt: string }[]
  repeatedWithFixes: RepeatedQuestionWithFix[]
}

function startOfWeekUtc(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const diff = day === 0 ? 6 : day - 1
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - diff)
  return d
}

function startOfMonthUtc(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

function roundHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10
}

export function buildQuestionClusters(rows: AskQueryRow[]): QuestionCluster[] {
  const map = new Map<string, QuestionCluster>()

  for (const row of rows) {
    const parsed = parseStoredAskResponse(row.response)
    const lowConfidence = parsed?.confidence === "low" || !row.prevented_owner_interrupt
    const hasMedia = parsed ? responseHasMedia(parsed) : false

    const existing = map.get(row.normalized_question)
    if (!existing) {
      map.set(row.normalized_question, {
        normalizedQuestion: row.normalized_question,
        displayQuestion: row.question_text,
        askCount: 1,
        preventedCount: row.prevented_owner_interrupt ? 1 : 0,
        lowConfidenceCount: lowConfidence ? 1 : 0,
        standardId: row.standard_id,
        hasMedia: hasMedia,
        lastAskedAt: row.created_at,
      })
      continue
    }

    existing.askCount += 1
    if (row.prevented_owner_interrupt) existing.preventedCount += 1
    if (lowConfidence) existing.lowConfidenceCount += 1
    if (row.standard_id && !existing.standardId) existing.standardId = row.standard_id
    if (hasMedia) existing.hasMedia = true
    if (row.created_at > existing.lastAskedAt) {
      existing.lastAskedAt = row.created_at
      existing.displayQuestion = row.question_text
    }
  }

  return [...map.values()].sort((a, b) => b.askCount - a.askCount)
}

function confusionSummary(cluster: QuestionCluster): string {
  if (!cluster.standardId && cluster.lowConfidenceCount > 0) {
    return "No verified play—staff keep asking without a floor standard."
  }
  if (cluster.lowConfidenceCount > 0 && cluster.preventedCount === 0) {
    return "Answers are not sticking—capture or improve the play."
  }
  if (cluster.askCount >= 3 && cluster.preventedCount < cluster.askCount) {
    return "Same question keeps surfacing—training or play clarity may be thin."
  }
  if (cluster.askCount >= 2) {
    return "Repeated on the floor—worth a play, media, or training pass."
  }
  return "Operational question cluster needs review."
}

export function buildConfusionAreas(clusters: QuestionCluster[]): ConfusionArea[] {
  return clusters
    .filter((c) => c.askCount >= 2 || c.lowConfidenceCount > 0)
    .map((c) => ({
      question: c.displayQuestion,
      askCount: c.askCount,
      lowConfidenceCount: c.lowConfidenceCount,
      preventedCount: c.preventedCount,
      summary: confusionSummary(c),
      standardId: c.standardId,
    }))
    .sort((a, b) => b.askCount - a.askCount || b.lowConfidenceCount - a.lowConfidenceCount)
    .slice(0, 8)
}

export function buildQuestionsPreventedMetrics(
  rows: AskQueryRow[],
  standardIdsWithTraining: Set<string>
): QuestionsPreventedMetrics {
  const weekStart = startOfWeekUtc()
  const monthStart = startOfMonthUtc()

  const monthRows = rows.filter((r) => new Date(r.created_at) >= monthStart)
  const weekRows = rows.filter((r) => new Date(r.created_at) >= weekStart)

  const preventedMonth = monthRows.filter((r) => r.prevented_owner_interrupt)
  const interruptionsAvoided = preventedMonth.length

  const clusters = buildQuestionClusters(monthRows)
  const mostAsked = clusters[0] ?? null

  const unverifiedQuestions = clusters
    .filter((c) => c.lowConfidenceCount > 0)
    .map((c) => ({
      question: c.displayQuestion,
      count: c.lowConfidenceCount,
      lastAskedAt: c.lastAskedAt,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const repeatedWithFixes: RepeatedQuestionWithFix[] = []
  for (const cluster of clusters) {
    const hasTrainingModule = cluster.standardId
      ? standardIdsWithTraining.has(cluster.standardId)
      : false
    const fixKind = suggestFixForRepeatedQuestion({
      askCount: cluster.askCount,
      standardId: cluster.standardId,
      lowConfidenceCount: cluster.lowConfidenceCount,
      hasTrainingModule,
      hasMedia: cluster.hasMedia,
    })
    if (!fixKind) continue
    repeatedWithFixes.push({ ...cluster, fixKind, hasTrainingModule })
  }

  const topStaffQuestions: StaffQuestionInsight[] = clusters.slice(0, 8).map((c) => ({
    question: c.displayQuestion,
    askCount: c.askCount,
    preventedCount: c.preventedCount,
    standardId: c.standardId,
  }))

  return {
    questionsAnsweredThisWeek: weekRows.length,
    questionsAnsweredThisMonth: monthRows.length,
    questionsPreventedThisMonth: preventedMonth.length,
    interruptionsAvoidedThisMonth: interruptionsAvoided,
    ownerHoursReturnedThisMonth: roundHours(interruptionsAvoided * MINUTES_SAVED_PER_ASK),
    mostAsked: mostAsked
      ? { question: mostAsked.displayQuestion, count: mostAsked.askCount }
      : null,
    topStaffQuestions,
    confusionAreas: buildConfusionAreas(clusters),
    unverifiedQuestions,
    repeatedWithFixes: repeatedWithFixes.slice(0, 8),
  }
}
