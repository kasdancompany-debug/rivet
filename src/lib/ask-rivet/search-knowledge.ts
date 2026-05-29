import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import { parseStepPlayMetadata } from "@/lib/sops/play-metadata"
import type { Tables } from "@/types/database"

import { questionTokens } from "./normalize-question"

export type KnowledgeChunk = {
  standardId: string
  standardTitle: string
  category: string
  source: string
  text: string
  weight: number
  moduleId?: string
}

export type SearchableStandard = Tables<"standards"> & {
  standard_steps: Tables<"standard_steps">[]
}

export type SearchableTrainingModule = Pick<
  Tables<"training_modules">,
  "id" | "title" | "description" | "assigned_role"
>

function pushChunk(
  chunks: KnowledgeChunk[],
  base: Pick<KnowledgeChunk, "standardId" | "standardTitle" | "category"> & { moduleId?: string },
  source: string,
  text: string,
  weight: number
) {
  const t = text.trim()
  if (t.length < 3) return
  chunks.push({ ...base, source, text: t, weight })
}

export function buildKnowledgeIndex(standards: SearchableStandard[]): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = []

  for (const sop of standards) {
    if (sop.status !== "active") continue
    const capture = parseStandardsCapture(sop.standards_capture)
    const base = { standardId: sop.id, standardTitle: sop.title, category: sop.category }

    pushChunk(chunks, base, "play_title", sop.title, 3)
    if (sop.description) pushChunk(chunks, base, "purpose", sop.description, 2.5)

    const memory = capture?.operationalMemory
    if (memory?.successLooksLike) pushChunk(chunks, base, "success", memory.successLooksLike, 3)
    if (memory?.failureLooksLike) pushChunk(chunks, base, "failure", memory.failureLooksLike, 2.5)
    if (memory?.ifNobodyAsks) pushChunk(chunks, base, "escalation", memory.ifNobodyAsks, 2)
    if (memory?.ownerNote) pushChunk(chunks, base, "owner_note", memory.ownerNote, 2.5)
    for (const m of memory?.newHireMistakes ?? []) {
      pushChunk(chunks, base, "new_hire_mistake", m, 2)
    }
    for (const faq of memory?.faqs ?? []) {
      pushChunk(chunks, base, "faq_question", faq.question, 2.5)
      pushChunk(chunks, base, "faq_answer", faq.answer, 2)
    }

    const inference = capture?.playInference
    if (inference?.successCriteria) pushChunk(chunks, base, "success_criteria", inference.successCriteria, 2)
    if (inference?.operationalProblem) pushChunk(chunks, base, "problem", inference.operationalProblem, 1.5)
    for (const dep of inference?.hiddenDependencies ?? []) {
      pushChunk(chunks, base, "dependency", dep, 1.5)
    }
    for (const gap of inference?.trainingGaps ?? []) {
      pushChunk(chunks, base, "training_gap", gap, 1.5)
    }

    for (const qs of capture?.qualityStandards ?? []) {
      pushChunk(chunks, base, "quality", qs, 1.5)
    }

    const pack = capture?.trainingPack
    if (pack?.learningObjectives?.length) {
      pushChunk(chunks, base, "training_objective", pack.learningObjectives.join(". "), 2)
    }
    for (const lesson of pack?.lessonSections ?? []) {
      pushChunk(chunks, base, "training_lesson", `${lesson.title}. ${lesson.body}`, 2)
    }
    if (pack?.certificationBadge?.title) {
      pushChunk(chunks, base, "certification", `${pack.certificationBadge.title}. ${pack.certificationBadge.description ?? ""}`, 2)
    }

    for (const step of sop.standard_steps ?? []) {
      pushChunk(chunks, base, "step", `${step.title}. ${step.instructions}`, 2)
      if (step.verification) pushChunk(chunks, base, "verification", step.verification, 2.5)
      const meta = parseStepPlayMetadata(step.play_metadata)
      if (meta.whyItMatters) pushChunk(chunks, base, "why_it_matters", meta.whyItMatters, 2)
      if (meta.visualTarget) pushChunk(chunks, base, "visual_target", meta.visualTarget, 2)
      for (const mistake of meta.commonMistakes ?? []) {
        pushChunk(chunks, base, "common_mistake", mistake, 2.5)
      }
    }
  }

  return chunks
}

export function buildModuleKnowledgeIndex(
  modules: SearchableTrainingModule[],
  items: { module_id: string; standard_id: string }[],
  standards: SearchableStandard[]
): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = []
  const standardById = new Map(standards.map((s) => [s.id, s]))

  for (const mod of modules) {
    const linked = items.filter((i) => i.module_id === mod.id)
    const primary = linked.map((i) => standardById.get(i.standard_id)).find(Boolean)
    const standardId = primary?.id ?? linked[0]?.standard_id ?? mod.id
    const standardTitle = primary?.title ?? mod.title

    const base = {
      standardId,
      standardTitle,
      category: primary?.category ?? "training",
      moduleId: mod.id,
    }

    pushChunk(chunks, base, "training_module", mod.title, 3)
    if (mod.description) pushChunk(chunks, base, "training_module", mod.description, 2.5)
    if (mod.assigned_role) pushChunk(chunks, base, "training_role", mod.assigned_role, 1.5)

    for (const item of linked) {
      const sop = standardById.get(item.standard_id)
      if (sop) pushChunk(chunks, base, "training_play_link", sop.title, 2)
    }
  }

  return chunks
}

export type ScoredStandardMatch = {
  standardId: string
  standardTitle: string
  score: number
  topChunks: KnowledgeChunk[]
}

export type ScoredModuleMatch = {
  moduleId: string
  moduleTitle: string
  score: number
  topChunks: KnowledgeChunk[]
  linkedStandardId: string | null
}

export function scoreStandardsForQuestion(
  question: string,
  standards: SearchableStandard[]
): ScoredStandardMatch[] {
  const tokens = questionTokens(question)
  if (tokens.length === 0) return []

  const chunks = buildKnowledgeIndex(standards)
  const byStandard = new Map<string, { score: number; chunks: KnowledgeChunk[]; title: string }>()

  for (const chunk of chunks) {
    if (chunk.moduleId) continue
    const hay = chunk.text.toLowerCase()
    let hit = 0
    for (const token of tokens) {
      if (hay.includes(token)) hit += chunk.weight
    }
    if (hit <= 0) continue
    const row = byStandard.get(chunk.standardId) ?? {
      score: 0,
      chunks: [],
      title: chunk.standardTitle,
    }
    row.score += hit
    row.chunks.push(chunk)
    byStandard.set(chunk.standardId, row)
  }

  return [...byStandard.entries()]
    .map(([standardId, row]) => ({
      standardId,
      standardTitle: row.title,
      score: row.score,
      topChunks: row.chunks.sort((a, b) => b.weight - a.weight).slice(0, 8),
    }))
    .sort((a, b) => b.score - a.score)
}

export function scoreModulesForQuestion(
  question: string,
  modules: SearchableTrainingModule[],
  items: { module_id: string; standard_id: string }[],
  standards: SearchableStandard[]
): ScoredModuleMatch[] {
  const tokens = questionTokens(question)
  if (tokens.length === 0 || modules.length === 0) return []

  const chunks = buildModuleKnowledgeIndex(modules, items, standards)
  const byModule = new Map<string, { score: number; chunks: KnowledgeChunk[]; title: string }>()

  for (const chunk of chunks) {
    if (!chunk.moduleId) continue
    const hay = chunk.text.toLowerCase()
    let hit = 0
    for (const token of tokens) {
      if (hay.includes(token)) hit += chunk.weight
    }
    if (hit <= 0) continue
    const row = byModule.get(chunk.moduleId) ?? {
      score: 0,
      chunks: [],
      title: chunk.standardTitle,
    }
    row.score += hit
    row.chunks.push(chunk)
    byModule.set(chunk.moduleId, row)
  }

  const standardById = new Map(standards.map((s) => [s.id, s]))

  return [...byModule.entries()]
    .map(([moduleId, row]) => {
      const mod = modules.find((m) => m.id === moduleId)
      const linkedId = items.find((i) => i.module_id === moduleId)?.standard_id ?? null
      return {
        moduleId,
        moduleTitle: mod?.title ?? row.title,
        score: row.score,
        topChunks: row.chunks.sort((a, b) => b.weight - a.weight).slice(0, 6),
        linkedStandardId: linkedId && standardById.has(linkedId) ? linkedId : null,
      }
    })
    .sort((a, b) => b.score - a.score)
}

/** Pick best play match, optionally boosted by a strong training-module hit. */
export function resolveBestStandardMatch(
  question: string,
  standards: SearchableStandard[],
  modules: SearchableTrainingModule[],
  items: { module_id: string; standard_id: string }[]
): { match: ScoredStandardMatch | null; moduleMatches: ScoredModuleMatch[] } {
  const standardMatches = scoreStandardsForQuestion(question, standards)
  const moduleMatches = scoreModulesForQuestion(question, modules, items, standards)

  let top = standardMatches[0] ?? null

  const strongModule = moduleMatches.find((m) => m.score >= 6 && m.linkedStandardId)
  if (strongModule?.linkedStandardId) {
    const fromModule = standardMatches.find((s) => s.standardId === strongModule.linkedStandardId)
    if (fromModule && (!top || fromModule.score < strongModule.score * 0.85)) {
      top = {
        ...fromModule,
        score: Math.max(fromModule.score, strongModule.score * 0.9),
        topChunks: [...fromModule.topChunks, ...strongModule.topChunks].slice(0, 8),
      }
    } else if (!top) {
      const sop = standards.find((s) => s.id === strongModule.linkedStandardId)
      if (sop) {
        top = {
          standardId: sop.id,
          standardTitle: sop.title,
          score: strongModule.score,
          topChunks: strongModule.topChunks,
        }
      }
    }
  }

  return { match: top, moduleMatches }
}
