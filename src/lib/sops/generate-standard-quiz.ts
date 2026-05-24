export const STANDARD_QUIZ_VERSION = 1 as const

export type StandardQuizQuestionType = "multiple_choice" | "true_false" | "scenario"

export type StandardQuizQuestion = {
  id: string
  type: StandardQuizQuestionType
  prompt: string
  options: string[]
  correctIndex: number
}

export type StandardQuizV1 = {
  version: typeof STANDARD_QUIZ_VERSION
  generatedAt: string
  questions: StandardQuizQuestion[]
}

export const STANDARD_QUIZ_TYPE_LABELS: Record<StandardQuizQuestionType, string> = {
  multiple_choice: "Multiple choice",
  true_false: "True / false",
  scenario: "Scenario",
}

export type StandardQuizInput = {
  title: string
  description: string | null
  category: string
  steps: {
    id?: string
    title: string
    instructions: string
    is_critical?: boolean
    verification?: string | null
  }[]
  competencyMarkers?: string[]
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

function stepDistractors(steps: StandardQuizInput["steps"], exclude: string): string[] {
  return steps
    .map((s) => s.title.trim())
    .filter((t) => t.length > 0 && t !== exclude)
}

function truncate(text: string, max: number): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function multipleChoiceQuestion(
  sopTitle: string,
  step: StandardQuizInput["steps"][0],
  steps: StandardQuizInput["steps"],
  index: number
): StandardQuizQuestion | null {
  const title = step.title.trim()
  if (!title) return null
  const wrong = stepDistractors(steps, title)
  if (wrong.length < 2) return null
  const options = shuffle([title, ...wrong.slice(0, 3)])
  return {
    id: `mc-${index}-${title.slice(0, 12)}`,
    type: "multiple_choice",
    prompt: `Which step is part of “${sopTitle}”?`,
    options,
    correctIndex: options.indexOf(title),
  }
}

function trueFalseQuestion(
  sopTitle: string,
  step: StandardQuizInput["steps"][0],
  index: number,
  affirmative: boolean
): StandardQuizQuestion {
  const instruction = step.instructions.trim()
  const statement =
    instruction.length >= 12
      ? `When running “${sopTitle}”, ${truncate(instruction, 120).replace(/\.$/, "")}.`
      : `“${step.title.trim()}” is a required step in “${sopTitle}”.`
  const options = ["True", "False"]
  return {
    id: `tf-${index}`,
    type: "true_false",
    prompt: statement,
    options,
    correctIndex: affirmative ? 0 : 1,
  }
}

function scenarioQuestion(
  sopTitle: string,
  step: StandardQuizInput["steps"][0],
  steps: StandardQuizInput["steps"],
  index: number
): StandardQuizQuestion | null {
  const correct = step.title.trim()
  if (!correct) return null
  const wrong = stepDistractors(steps, correct)
  if (wrong.length < 2) return null
  const options = shuffle([correct, ...wrong.slice(0, 3)])
  const context =
    step.instructions.trim().length >= 8
      ? truncate(step.instructions, 100)
      : `You are working through “${sopTitle}”.`
  return {
    id: `sc-${index}`,
    type: "scenario",
    prompt: `Scenario: ${context} What should you do next?`,
    options,
    correctIndex: options.indexOf(correct),
  }
}

/** Generate 3–5 quiz questions from SOP content (multiple choice, true/false, scenario). */
export function generateStandardQuiz(input: StandardQuizInput): StandardQuizV1 {
  const steps = input.steps.filter((s) => s.title.trim().length > 0)
  const title = input.title.trim() || "this standard"
  const questions: StandardQuizQuestion[] = []

  const critical = steps.find((s) => s.is_critical) ?? steps[0]
  if (critical) {
    questions.push(trueFalseQuestion(title, critical, questions.length, true))
  }

  for (const step of steps.slice(0, 2)) {
    const mc = multipleChoiceQuestion(title, step, steps, questions.length)
    if (mc) questions.push(mc)
  }

  const scenarioStep = steps[Math.min(1, steps.length - 1)] ?? steps[0]
  if (scenarioStep) {
    const sc = scenarioQuestion(title, scenarioStep, steps, questions.length)
    if (sc) questions.push(sc)
  }

  const marker = (input.competencyMarkers ?? []).find((m) => m.trim().length > 0)?.trim()
  if (marker && questions.length < 5) {
    const options = shuffle([marker, "No sign-off required", "Only after 90 days", "Owner discretion only"])
    questions.push({
      id: `tf-marker-${questions.length}`,
      type: "true_false",
      prompt: `Before running “${title}” alone, you need: ${marker}.`,
      options: ["True", "False"],
      correctIndex: 0,
    })
  }

  if (questions.length < 3 && steps.length > 0) {
    const step = steps[steps.length - 1]!
    questions.push(trueFalseQuestion(title, step, questions.length, false))
  }

  if (questions.length < 3) {
    questions.push({
      id: "tf-fallback-order",
      type: "true_false",
      prompt: `You can skip steps in “${title}” if you are in a rush.`,
      options: ["True", "False"],
      correctIndex: 1,
    })
  }

  const unique = new Map<string, StandardQuizQuestion>()
  for (const q of questions) {
    if (!unique.has(q.prompt)) unique.set(q.prompt, q)
  }

  const finalQuestions = [...unique.values()].slice(0, 5)
  while (finalQuestions.length < 3 && steps.length > 0) {
    const step = steps[finalQuestions.length % steps.length]!
    const mc = multipleChoiceQuestion(title, step, steps, finalQuestions.length)
    if (mc && !finalQuestions.some((q) => q.prompt === mc.prompt)) finalQuestions.push(mc)
    else break
  }

  return {
    version: STANDARD_QUIZ_VERSION,
    generatedAt: new Date().toISOString(),
    questions: finalQuestions.slice(0, 5),
  }
}

export function parseStandardQuiz(raw: unknown): StandardQuizV1 | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    if (Array.isArray(raw)) {
      return {
        version: STANDARD_QUIZ_VERSION,
        generatedAt: new Date().toISOString(),
        questions: raw.filter(isQuestion).slice(0, 5),
      }
    }
    return null
  }
  const obj = raw as Record<string, unknown>
  if (obj.version === STANDARD_QUIZ_VERSION && Array.isArray(obj.questions)) {
    return {
      version: STANDARD_QUIZ_VERSION,
      generatedAt: typeof obj.generatedAt === "string" ? obj.generatedAt : new Date().toISOString(),
      questions: obj.questions.filter(isQuestion).slice(0, 5),
    }
  }
  return null
}

function isQuestion(value: unknown): value is StandardQuizQuestion {
  if (!value || typeof value !== "object") return false
  const q = value as Record<string, unknown>
  return (
    typeof q.id === "string" &&
    typeof q.prompt === "string" &&
    Array.isArray(q.options) &&
    q.options.every((o) => typeof o === "string") &&
    typeof q.correctIndex === "number"
  )
}

export function gradeStandardQuiz(
  quiz: StandardQuizV1,
  answers: Record<string, number>
): { passed: boolean; score: number } {
  if (quiz.questions.length === 0) return { passed: true, score: 100 }
  let correct = 0
  for (const q of quiz.questions) {
    if (answers[q.id] === q.correctIndex) correct += 1
  }
  const score = Math.round((correct / quiz.questions.length) * 100)
  return { passed: score === 100, score }
}
