import {
  generateStandardQuiz,
  type StandardQuizInput,
  type StandardQuizQuestion,
} from "@/lib/sops/generate-standard-quiz"
import type { OperationalMemory, PlayInferenceMetadata } from "@/lib/standards-capture/types"
import type { StepPlayMetadata } from "@/lib/sops/play-metadata"

export const TRAINING_PACK_VERSION = 1 as const

export type TrainingPackStatus = "draft" | "published"

export type TrainingVideoSection = {
  title: string
  focus: string
  estimatedMinutes?: number
  mediaId?: string
}

export type TrainingLessonSection = {
  id: string
  title: string
  body: string
  mediaId?: string
  mediaKind?: "image" | "video"
}

export type VisualQuizPrompt = {
  id: string
  prompt: string
  goodLabel: string
  badLabel: string
  correct: "good" | "bad"
  goodMediaId?: string
  badMediaId?: string
}

export type PlayTrainingPack = {
  version: typeof TRAINING_PACK_VERSION
  generatedAt: string
  status: TrainingPackStatus
  learningObjectives: string[]
  lessonSections: TrainingLessonSection[]
  videoSections: TrainingVideoSection[]
  scenarioQuestions: string[]
  quizQuestions: StandardQuizQuestion[]
  visualQuizzes: VisualQuizPrompt[]
  completionChecklist: string[]
  requiresManagerSignOff: boolean
  certificationBadge: {
    title: string
    description: string
  }
  moduleId?: string
}

export type TrainingPackInput = {
  title: string
  description: string | null
  category: string
  assignedRoles: string[]
  competencyMarkers: string[]
  playInference?: PlayInferenceMetadata
  hasWalkthroughVideo: boolean
  walkthroughMediaId?: string | null
  photoMediaIds?: string[]
  operationalMemory?: OperationalMemory
  publish?: boolean
  steps: {
    title: string
    instructions: string
    verification?: string | null
    is_critical?: boolean
    playMetadata?: StepPlayMetadata
  }[]
}

function buildVideoSections(input: TrainingPackInput): TrainingVideoSection[] {
  const sections: TrainingVideoSection[] = []
  if (input.hasWalkthroughVideo) {
    sections.push({
      title: "Watch the full run-through",
      focus: "Pacing, order of operations, and where things live on the line.",
      estimatedMinutes: 3,
      mediaId: input.walkthroughMediaId ?? undefined,
    })
  }
  for (const step of input.steps.slice(0, 4)) {
    if (!step.title.trim()) continue
    const mediaId =
      step.playMetadata?.goodExample?.mediaId ??
      step.playMetadata?.mediaIds?.[0]
    sections.push({
      title: step.title.trim(),
      focus: step.instructions.trim().slice(0, 140) || "Match this step on your next shift.",
      estimatedMinutes: 2,
      mediaId,
    })
  }
  return sections.slice(0, 6)
}

function buildLessonSections(input: TrainingPackInput): TrainingLessonSection[] {
  const lessons: TrainingLessonSection[] = []

  if (input.hasWalkthroughVideo) {
    lessons.push({
      id: "lesson-intro",
      title: "Before you start",
      body: `Watch the operator walkthrough, then read each step for "${input.title.trim()}". Your manager will sign off once you can run it without reminders.`,
      mediaId: input.walkthroughMediaId ?? undefined,
      mediaKind: "video",
    })
  }

  for (const [i, step] of input.steps.entries()) {
    const title = step.title.trim()
    if (!title) continue
    const meta = step.playMetadata
    const visual = meta?.visualTarget?.trim()
    const why = meta?.whyItMatters?.trim()
    const bodyParts = [step.instructions.trim()]
    if (visual) bodyParts.push(`Visual target: ${visual}`)
    if (why) bodyParts.push(`Why it matters: ${why}`)
    if (step.verification?.trim()) bodyParts.push(`Verify: ${step.verification.trim()}`)

    lessons.push({
      id: `lesson-${i}`,
      title,
      body: bodyParts.filter(Boolean).join("\n\n"),
      mediaId: meta?.goodExample?.mediaId ?? meta?.mediaIds?.[0],
      mediaKind: meta?.goodExample?.mediaId ? "image" : undefined,
    })
  }

  const photos = input.photoMediaIds ?? []
  if (photos.length > 0) {
    lessons.push({
      id: "lesson-photos",
      title: "Reference photos",
      body: "Use these photos on the line when the written steps need a visual anchor.",
      mediaId: photos[0],
      mediaKind: "image",
    })
  }

  const goodId = input.operationalMemory?.goodExampleMediaId
  const badId = input.operationalMemory?.badExampleMediaId
  if (goodId || badId) {
    lessons.push({
      id: "lesson-examples",
      title: "Good vs bad on the floor",
      body: [
        input.operationalMemory?.successLooksLike?.trim(),
        input.operationalMemory?.failureLooksLike?.trim()
          ? `Avoid: ${input.operationalMemory.failureLooksLike.trim()}`
          : null,
      ]
        .filter(Boolean)
        .join("\n\n"),
      mediaId: goodId ?? undefined,
      mediaKind: goodId ? "image" : undefined,
    })
  }

  return lessons.slice(0, 12)
}

function buildVisualQuizzes(input: TrainingPackInput): VisualQuizPrompt[] {
  const quizzes: VisualQuizPrompt[] = []
  for (const [i, step] of input.steps.entries()) {
    const meta = step.playMetadata
    const target = meta?.visualTarget?.trim() || step.instructions.trim()
    if (target.length < 8) continue
    quizzes.push({
      id: `vq-${i}`,
      prompt: `For "${step.title.trim()}" — which outcome matches the standard?`,
      goodLabel: target.slice(0, 80),
      badLabel: meta?.commonMistakes?.[0]?.slice(0, 80) ?? "Close enough — ship it",
      correct: "good",
      goodMediaId: meta?.goodExample?.mediaId,
      badMediaId: meta?.badExample?.mediaId,
    })
    if (quizzes.length >= 3) break
  }
  if (quizzes.length === 0 && input.title) {
    quizzes.push({
      id: "vq-fallback",
      prompt: `Which approach matches "${input.title}"?`,
      goodLabel: "Follow the written play and verify before handoff",
      badLabel: "Improvise from memory when busy",
      correct: "good",
    })
  }
  return quizzes
}

export function generateTrainingPack(input: TrainingPackInput): PlayTrainingPack {
  const title = input.title.trim() || "this play"
  const success =
    input.playInference?.successCriteria?.trim() ||
    input.description?.trim() ||
    `Run "${title}" the same way every shift—with verification recorded.`

  const learningObjectives = [
    `Execute "${title}" without owner reminders.`,
    success,
    ...input.competencyMarkers.slice(0, 2).map((m) => `Meet competency: ${m}.`),
  ].slice(0, 5)

  const completionChecklist = input.steps
    .filter((s) => s.title.trim().length > 0)
    .map((s) => {
      const v = s.verification?.trim()
      return v ? `${s.title.trim()} — ${v}` : s.title.trim()
    })
    .slice(0, 10)

  const quizInput: StandardQuizInput = {
    title,
    description: input.description,
    category: input.category,
    steps: input.steps.map((s) => ({
      title: s.title,
      instructions: s.instructions,
      is_critical: s.is_critical,
      verification: s.verification,
    })),
    competencyMarkers: input.competencyMarkers,
  }
  const quiz = generateStandardQuiz(quizInput)
  const scenarioQuestions = quiz.questions
    .filter((q) => q.type === "scenario")
    .map((q) => q.prompt)
    .slice(0, 3)

  const roleLabel = input.assignedRoles[0]?.trim() || "Crew"
  const certTitle = `${title} — certified`

  return {
    version: TRAINING_PACK_VERSION,
    generatedAt: new Date().toISOString(),
    status: input.publish ? "published" : "draft",
    learningObjectives,
    lessonSections: buildLessonSections(input),
    videoSections: buildVideoSections(input),
    scenarioQuestions,
    quizQuestions: quiz.questions,
    visualQuizzes: buildVisualQuizzes(input),
    completionChecklist,
    requiresManagerSignOff: true,
    certificationBadge: {
      title: certTitle,
      description: `${roleLabel} completed watch → quiz → demonstrate → manager sign-off on a live shift.`,
    },
  }
}

export function parseTrainingPack(raw: unknown): PlayTrainingPack | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  if (o.version !== TRAINING_PACK_VERSION) return null

  const strList = (v: unknown, max = 10): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, max)
      : []

  const lessonSections: TrainingLessonSection[] = []
  if (Array.isArray(o.lessonSections)) {
    for (const row of o.lessonSections) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue
      const r = row as Record<string, unknown>
      const id = typeof r.id === "string" ? r.id : ""
      const title = typeof r.title === "string" ? r.title.trim() : ""
      if (!id || !title) continue
      lessonSections.push({
        id,
        title,
        body: typeof r.body === "string" ? r.body.trim() : "",
        mediaId: typeof r.mediaId === "string" ? r.mediaId : undefined,
        mediaKind: r.mediaKind === "video" ? "video" : r.mediaKind === "image" ? "image" : undefined,
      })
    }
  }

  const videoSections: TrainingVideoSection[] = []
  if (Array.isArray(o.videoSections)) {
    for (const row of o.videoSections) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue
      const r = row as Record<string, unknown>
      const t = typeof r.title === "string" ? r.title.trim() : ""
      if (!t) continue
      videoSections.push({
        title: t,
        focus: typeof r.focus === "string" ? r.focus.trim() : "",
        estimatedMinutes:
          typeof r.estimatedMinutes === "number" ? Math.max(1, Math.round(r.estimatedMinutes)) : undefined,
        mediaId: typeof r.mediaId === "string" ? r.mediaId : undefined,
      })
    }
  }

  const visualQuizzes: VisualQuizPrompt[] = []
  if (Array.isArray(o.visualQuizzes)) {
    for (const row of o.visualQuizzes) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue
      const r = row as Record<string, unknown>
      const id = typeof r.id === "string" ? r.id : ""
      const prompt = typeof r.prompt === "string" ? r.prompt.trim() : ""
      if (!id || !prompt) continue
      visualQuizzes.push({
        id,
        prompt,
        goodLabel: typeof r.goodLabel === "string" ? r.goodLabel.trim() : "Good",
        badLabel: typeof r.badLabel === "string" ? r.badLabel.trim() : "Bad",
        correct: r.correct === "bad" ? "bad" : "good",
        goodMediaId: typeof r.goodMediaId === "string" ? r.goodMediaId : undefined,
        badMediaId: typeof r.badMediaId === "string" ? r.badMediaId : undefined,
      })
    }
  }

  const quizQuestions: StandardQuizQuestion[] = []
  if (Array.isArray(o.quizQuestions)) {
    for (const row of o.quizQuestions) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue
      const r = row as Record<string, unknown>
      const id = typeof r.id === "string" ? r.id : ""
      const prompt = typeof r.prompt === "string" ? r.prompt.trim() : ""
      const type = r.type === "scenario" || r.type === "true_false" ? r.type : "multiple_choice"
      const options = Array.isArray(r.options)
        ? r.options.filter((x): x is string => typeof x === "string")
        : []
      if (!id || !prompt || options.length < 2) continue
      quizQuestions.push({
        id,
        type,
        prompt,
        options,
        correctIndex: typeof r.correctIndex === "number" ? r.correctIndex : 0,
      })
    }
  }

  const certRaw = o.certificationBadge
  let certificationBadge = { title: "Play certified", description: "Completed training on a live shift." }
  if (certRaw && typeof certRaw === "object" && !Array.isArray(certRaw)) {
    const c = certRaw as Record<string, unknown>
    certificationBadge = {
      title: typeof c.title === "string" ? c.title.trim() : certificationBadge.title,
      description: typeof c.description === "string" ? c.description.trim() : certificationBadge.description,
    }
  }

  return {
    version: TRAINING_PACK_VERSION,
    generatedAt: typeof o.generatedAt === "string" ? o.generatedAt : new Date().toISOString(),
    status: o.status === "published" ? "published" : "draft",
    learningObjectives: strList(o.learningObjectives, 6),
    lessonSections,
    videoSections,
    scenarioQuestions: strList(o.scenarioQuestions, 5),
    quizQuestions,
    visualQuizzes,
    completionChecklist: strList(o.completionChecklist, 12),
    requiresManagerSignOff: o.requiresManagerSignOff !== false,
    certificationBadge,
    moduleId: typeof o.moduleId === "string" ? o.moduleId : undefined,
  }
}
