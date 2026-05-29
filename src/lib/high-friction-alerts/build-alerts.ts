import { HIGH_FRICTION_ASK_THRESHOLD } from "@/lib/ask-rivet/types"
import {
  buildAlertRecommendations,
  primaryHrefForAlert,
} from "@/lib/high-friction-alerts/recommendations"
import {
  headlineForAskRepeat,
  headlineForInterruptionRepeat,
  headlineForQuizFail,
  headlineForViewsLowTraining,
} from "@/lib/high-friction-alerts/headlines"
import type { HighFrictionAlert } from "@/lib/high-friction-alerts/types"
import { normalizeSummaryKey } from "@/lib/owner-interruptions/normalize-summary"
import { parseStandardQuiz, type StandardQuizQuestion } from "@/lib/sops/generate-standard-quiz"
import type { Tables } from "@/types/database"

export const HIGH_FRICTION_INTERRUPTION_THRESHOLD = 2
export const HIGH_FRICTION_QUIZ_FAIL_THRESHOLD = 2
export const HIGH_FRICTION_VIEW_THRESHOLD = 5
export const HIGH_FRICTION_LOW_SCORE_THRESHOLD = 70
export const HIGH_FRICTION_LOW_PASS_RATE = 0.55

type AskRow = Pick<
  Tables<"rivet_ask_queries">,
  "question_text" | "normalized_question" | "standard_id" | "created_at"
>

type StandardRow = Pick<Tables<"standards">, "id" | "title" | "quiz_questions">

type QuizCompletionRow = Pick<
  Tables<"employee_standard_quiz_completions">,
  "standard_id" | "employee_id" | "score" | "passed" | "answers"
>

type PlayViewRow = Pick<Tables<"standard_play_views">, "standard_id" | "viewed_by" | "created_at">

function questionsForStandard(standard: StandardRow): StandardQuizQuestion[] {
  const parsed = parseStandardQuiz(standard.quiz_questions)
  return parsed?.questions ?? []
}

function parseAnswers(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const out: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value
  }
  return out
}

function buildAskAlerts(input: {
  askRows: AskRow[]
  standardsById: Map<string, StandardRow>
}): HighFrictionAlert[] {
  const clusters = new Map<
    string,
    { question: string; count: number; standardId: string | null }
  >()

  for (const row of input.askRows) {
    const key = row.normalized_question.trim()
    if (!key) continue
    const cur = clusters.get(key) ?? {
      question: row.question_text.trim(),
      count: 0,
      standardId: row.standard_id,
    }
    cur.count += 1
    if (!cur.standardId && row.standard_id) cur.standardId = row.standard_id
    clusters.set(key, cur)
  }

  const alerts: HighFrictionAlert[] = []
  for (const [key, cluster] of clusters) {
    if (cluster.count < HIGH_FRICTION_ASK_THRESHOLD) continue
    const standard = cluster.standardId ? input.standardsById.get(cluster.standardId) : null
    const ctx = {
      source: "ask_rivet_repeat" as const,
      standardId: cluster.standardId,
      standardTitle: standard?.title ?? null,
      topicLabel: cluster.question,
    }
    const recommendations = buildAlertRecommendations(ctx)
    alerts.push({
      id: `ask:${key}`,
      source: "ask_rivet_repeat",
      headline: headlineForAskRepeat(cluster.question, standard?.title ?? null),
      detail: `Asked ${cluster.count} times recently without a confident answer.`,
      count: cluster.count,
      standardId: cluster.standardId,
      standardTitle: standard?.title ?? null,
      recommendations,
      primaryHref: primaryHrefForAlert(ctx, recommendations),
    })
  }
  return alerts
}

function buildInterruptionAlerts(input: {
  interruptions: Tables<"owner_interruptions">[]
}): HighFrictionAlert[] {
  const counts = new Map<string, { label: string; count: number }>()
  for (const row of input.interruptions) {
    const key = normalizeSummaryKey(row.summary)
    if (!key) continue
    const cur = counts.get(key) ?? { label: row.summary.trim(), count: 0 }
    cur.count += 1
    counts.set(key, cur)
  }

  const alerts: HighFrictionAlert[] = []
  for (const [key, cluster] of counts) {
    if (cluster.count < HIGH_FRICTION_INTERRUPTION_THRESHOLD) continue
    const ctx = {
      source: "interruption_repeat" as const,
      standardId: null,
      standardTitle: null,
      topicLabel: cluster.label,
    }
    const recommendations = buildAlertRecommendations(ctx)
    alerts.push({
      id: `interrupt:${key}`,
      source: "interruption_repeat",
      headline: headlineForInterruptionRepeat(cluster.label),
      detail: `Logged ${cluster.count} times—still routing back to you.`,
      count: cluster.count,
      standardId: null,
      standardTitle: null,
      recommendations,
      primaryHref: primaryHrefForAlert(ctx, recommendations),
    })
  }
  return alerts
}

function buildQuizFailAlerts(input: {
  standards: StandardRow[]
  quizCompletions: QuizCompletionRow[]
}): HighFrictionAlert[] {
  const standardsById = new Map(input.standards.map((s) => [s.id, s]))
  const failMap = new Map<
    string,
    { standardId: string; questionId: string; prompt: string; failCount: number; employees: Set<string> }
  >()

  for (const completion of input.quizCompletions) {
    const standard = standardsById.get(completion.standard_id)
    if (!standard) continue
    const questions = questionsForStandard(standard)
    if (questions.length === 0) continue
    const answers = parseAnswers(completion.answers)

    for (const question of questions) {
      const selected = answers[question.id]
      if (selected === question.correctIndex) continue
      const aggKey = `${completion.standard_id}:${question.id}`
      const cur = failMap.get(aggKey) ?? {
        standardId: completion.standard_id,
        questionId: question.id,
        prompt: question.prompt,
        failCount: 0,
        employees: new Set<string>(),
      }
      cur.failCount += 1
      cur.employees.add(completion.employee_id)
      failMap.set(aggKey, cur)
    }
  }

  const alerts: HighFrictionAlert[] = []
  for (const [, agg] of failMap) {
    if (agg.failCount < HIGH_FRICTION_QUIZ_FAIL_THRESHOLD) continue
    const standard = standardsById.get(agg.standardId)
    if (!standard) continue
    const ctx = {
      source: "quiz_question_fail" as const,
      standardId: agg.standardId,
      standardTitle: standard.title,
      topicLabel: standard.title,
    }
    const recommendations = buildAlertRecommendations(ctx)
    alerts.push({
      id: `quiz:${agg.standardId}:${agg.questionId}`,
      source: "quiz_question_fail",
      headline: headlineForQuizFail(standard.title, agg.prompt),
      detail: `${agg.failCount} missed answers across ${agg.employees.size} staff on the same quiz question.`,
      count: agg.failCount,
      standardId: agg.standardId,
      standardTitle: standard.title,
      recommendations,
      primaryHref: primaryHrefForAlert(ctx, recommendations),
    })
  }
  return alerts
}

function buildViewTrainingAlerts(input: {
  standards: StandardRow[]
  playViews: PlayViewRow[]
  quizCompletions: QuizCompletionRow[]
}): HighFrictionAlert[] {
  const standardsById = new Map(input.standards.map((s) => [s.id, s]))
  const viewCounts = new Map<string, number>()
  for (const view of input.playViews) {
    viewCounts.set(view.standard_id, (viewCounts.get(view.standard_id) ?? 0) + 1)
  }

  const scoreAgg = new Map<string, { total: number; n: number; passed: number }>()
  for (const row of input.quizCompletions) {
    const cur = scoreAgg.get(row.standard_id) ?? { total: 0, n: 0, passed: 0 }
    cur.total += row.score
    cur.n += 1
    if (row.passed) cur.passed += 1
    scoreAgg.set(row.standard_id, cur)
  }

  const alerts: HighFrictionAlert[] = []
  for (const [standardId, views] of viewCounts) {
    if (views < HIGH_FRICTION_VIEW_THRESHOLD) continue
    const standard = standardsById.get(standardId)
    if (!standard) continue

    const scores = scoreAgg.get(standardId)
    const avgScore = scores && scores.n > 0 ? scores.total / scores.n : null
    const passRate = scores && scores.n > 0 ? scores.passed / scores.n : null
    const lowScore =
      avgScore == null || avgScore < HIGH_FRICTION_LOW_SCORE_THRESHOLD || (passRate ?? 0) < HIGH_FRICTION_LOW_PASS_RATE
    if (!lowScore) continue

    const ctx = {
      source: "high_views_low_training" as const,
      standardId,
      standardTitle: standard.title,
      topicLabel: standard.title,
    }
    const recommendations = buildAlertRecommendations(ctx)
    alerts.push({
      id: `views:${standardId}`,
      source: "high_views_low_training",
      headline: headlineForViewsLowTraining(standard.title),
      detail: `Opened ${views} times recently${
        avgScore != null ? ` but average quiz score is ${Math.round(avgScore)}%` : " with weak training scores"
      }.`,
      count: views,
      standardId,
      standardTitle: standard.title,
      recommendations,
      primaryHref: primaryHrefForAlert(ctx, recommendations),
    })
  }
  return alerts
}

export function buildHighFrictionAlerts(input: {
  askRows: AskRow[]
  interruptions: Tables<"owner_interruptions">[]
  standards: StandardRow[]
  quizCompletions: QuizCompletionRow[]
  playViews: PlayViewRow[]
  maxAlerts?: number
}): HighFrictionAlert[] {
  const standardsById = new Map(input.standards.map((s) => [s.id, s]))
  const merged = [
    ...buildAskAlerts({ askRows: input.askRows, standardsById }),
    ...buildInterruptionAlerts({ interruptions: input.interruptions }),
    ...buildQuizFailAlerts({
      standards: input.standards,
      quizCompletions: input.quizCompletions,
    }),
    ...buildViewTrainingAlerts({
      standards: input.standards,
      playViews: input.playViews,
      quizCompletions: input.quizCompletions,
    }),
  ]

  return merged
    .sort((a, b) => b.count - a.count || a.headline.localeCompare(b.headline))
    .slice(0, input.maxAlerts ?? 12)
}
