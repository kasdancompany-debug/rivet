import {
  fixKindHref,
  parseStoredAskResponse,
  suggestFixForRepeatedQuestion,
  type AskRivetFixKind,
} from "@/lib/ask-rivet/fix-suggestions"
import {
  buildQuestionClusters,
  buildQuestionsPreventedMetrics,
  type AskQueryRow,
  type QuestionCluster,
  type QuestionsPreventedMetrics,
} from "@/lib/ask-rivet/questions-prevented"

export type AskRivetRecommendation = {
  fixKind: AskRivetFixKind
  question: string
  normalizedQuestion: string
  askCount: number
  href: string
  reasonKey: AskRivetFixKind
}

export type AskRivetIntelligenceDashboard = QuestionsPreventedMetrics & {
  /** Alias for questionsAnsweredThisMonth */
  questionsAskedThisMonth: number
  repeatedQuestionsCount: number
  lowConfidenceQuestionsCount: number
  repeatedQuestions: QuestionCluster[]
  lowConfidenceQuestions: {
    question: string
    count: number
    lastAskedAt: string
  }[]
  recommendations: AskRivetRecommendation[]
}

function countLowConfidenceAsks(rows: AskQueryRow[]): number {
  let n = 0
  for (const row of rows) {
    const parsed = parseStoredAskResponse(row.response)
    if (parsed?.confidence === "low" || !row.prevented_owner_interrupt) n += 1
  }
  return n
}

function buildRecommendations(
  clusters: QuestionCluster[],
  standardIdsWithTraining: Set<string>
): AskRivetRecommendation[] {
  const recs: AskRivetRecommendation[] = []

  for (const cluster of clusters) {
    const hasTrainingModule = cluster.standardId
      ? standardIdsWithTraining.has(cluster.standardId)
      : false

    let fixKind = suggestFixForRepeatedQuestion({
      askCount: cluster.askCount,
      standardId: cluster.standardId,
      lowConfidenceCount: cluster.lowConfidenceCount,
      hasTrainingModule,
      hasMedia: cluster.hasMedia,
    })

    if (!fixKind && cluster.lowConfidenceCount > 0 && !cluster.standardId) {
      fixKind = "create_play"
    }

    if (!fixKind && cluster.lowConfidenceCount > 0 && cluster.standardId) {
      fixKind = cluster.hasMedia ? "improve_play" : "add_media"
    }

    if (!fixKind) continue

    recs.push({
      fixKind,
      question: cluster.displayQuestion,
      normalizedQuestion: cluster.normalizedQuestion,
      askCount: cluster.askCount,
      href: fixKindHref(fixKind, {
        standardId: cluster.standardId,
        question: cluster.displayQuestion,
      }),
      reasonKey: fixKind,
    })
  }

  const priority: Record<AskRivetFixKind, number> = {
    create_play: 0,
    add_media: 1,
    add_training: 2,
    improve_play: 3,
  }

  return recs.sort(
    (a, b) =>
      priority[a.fixKind] - priority[b.fixKind] ||
      b.askCount - a.askCount
  )
}

export function buildAskRivetIntelligenceDashboard(
  rows: AskQueryRow[],
  standardIdsWithTraining: Set<string>
): AskRivetIntelligenceDashboard {
  const metrics = buildQuestionsPreventedMetrics(rows, standardIdsWithTraining)
  const clusters = buildQuestionClusters(rows)
  const repeatedQuestions = clusters.filter((c) => c.askCount >= 2)

  const lowConfidenceQuestions = clusters
    .filter((c) => c.lowConfidenceCount > 0)
    .map((c) => ({
      question: c.displayQuestion,
      count: c.lowConfidenceCount,
      lastAskedAt: c.lastAskedAt,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    ...metrics,
    questionsAskedThisMonth: metrics.questionsAnsweredThisMonth,
    repeatedQuestionsCount: repeatedQuestions.length,
    lowConfidenceQuestionsCount: countLowConfidenceAsks(rows),
    repeatedQuestions: repeatedQuestions.slice(0, 10),
    lowConfidenceQuestions,
    recommendations: buildRecommendations(clusters, standardIdsWithTraining).slice(0, 12),
  }
}
