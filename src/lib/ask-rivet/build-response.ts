import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import {
  isAudioMedia,
  isImageMedia,
  isPdfMedia,
  isVideoMedia,
  mediaDisplayUrl,
  mediaLabel,
  standardMediaApiPath,
} from "@/lib/standards/standard-media-display"
import { COPY } from "@/lib/interface-copy"
import type { Tables } from "@/types/database"

import {
  askRivetConfidenceScorePercent,
  askRivetConfidenceTier,
  ASK_RIVET_LOW_SCORE_THRESHOLD,
  ASK_RIVET_MATCH_THRESHOLD,
} from "./confidence"
import type { KnowledgeChunk, ScoredStandardMatch, SearchableStandard } from "./search-knowledge"

import type {
  AskRivetMediaAttachment,
  AskRivetRelatedCertification,
  AskRivetResponse,
  AskRivetSourceCitation,
  AskRivetSourceLink,
} from "./types"

type BuildResponseInput = {
  question: string
  match: ScoredStandardMatch | null
  standard: SearchableStandard | null
  signedMedia: StandardMediaRowSigned[]
  relatedModules: { id: string; title: string }[]
  portal?: boolean
}

const SOURCES_SEARCHED = [
  "Plays",
  "Training modules",
  "Photos",
  "Videos",
  "PDFs",
  "FAQs",
  "Owner notes",
  "Certifications",
]

function playHref(standardId: string, portal: boolean): string {
  return portal ? `/learn/plays/${standardId}` : `/sops/${standardId}`
}

function trainingHref(moduleId: string, portal: boolean): string {
  return portal ? `/learn/${moduleId}` : `/training/modules/${moduleId}`
}

function mediaUrlForId(id: string | null | undefined, media: StandardMediaRowSigned[]): string | null {
  if (!id) return null
  return media.find((m) => m.id === id)?.signedUrl ?? standardMediaApiPath(id)
}

function attachmentKind(
  media: StandardMediaRowSigned
): AskRivetMediaAttachment["kind"] {
  if (isVideoMedia(media)) return "video"
  if (isPdfMedia(media)) return "pdf"
  if (isAudioMedia(media)) return "audio"
  return "photo"
}

function sourceLabel(source: string): string {
  switch (source) {
    case "play_title":
      return "Play"
    case "faq_answer":
    case "faq_question":
      return "FAQ"
    case "owner_note":
      return "Owner note"
    case "verification":
      return "Verification"
    case "step":
      return "Play step"
    case "common_mistake":
    case "new_hire_mistake":
      return "Common mistake"
    case "success":
    case "success_criteria":
      return "Success criteria"
    case "failure":
      return "Failure criteria"
    case "escalation":
      return "Escalation"
    case "training_module":
    case "training_lesson":
    case "training_objective":
      return "Training"
    case "certification":
      return "Certification"
    default:
      return "Play"
  }
}

function buildSourceLinks(
  standardId: string,
  chunks: KnowledgeChunk[],
  portal: boolean
): AskRivetSourceLink[] {
  const seen = new Set<string>()
  const links: AskRivetSourceLink[] = []
  const playLink = playHref(standardId, portal)

  for (const chunk of chunks) {
    const key = `${chunk.source}:${chunk.text.slice(0, 80)}`
    if (seen.has(key)) continue
    seen.add(key)
    links.push({
      label: sourceLabel(chunk.source),
      source: chunk.source,
      href:
        chunk.source.startsWith("training") && chunk.moduleId
          ? trainingHref(chunk.moduleId, portal)
          : playLink,
      excerpt: chunk.text.slice(0, 160),
    })
    if (links.length >= 6) break
  }
  return links
}

function buildMediaAttachments(
  standard: SearchableStandard,
  signedMedia: StandardMediaRowSigned[]
): AskRivetMediaAttachment[] {
  const capture = parseStandardsCapture(standard.standards_capture)
  const memory = capture?.operationalMemory
  const out: AskRivetMediaAttachment[] = []
  const seen = new Set<string>()

  function add(media: StandardMediaRowSigned | undefined, caption: string | null) {
    const url = media ? mediaDisplayUrl(media) : null
    if (!url || seen.has(url)) return
    seen.add(url)
    out.push({
      url,
      kind: media ? attachmentKind(media) : "photo",
      caption,
    })
  }

  const ids = [
    memory?.goodExampleMediaId,
    memory?.badExampleMediaId,
    capture?.walkthroughMediaId,
    capture?.audioExplanationMediaId,
    ...(capture?.photoMediaIds ?? []),
    ...(capture?.supportingDocumentMediaIds ?? []),
    ...(capture?.attachmentMediaIds ?? []),
  ].filter(Boolean) as string[]

  for (const id of ids) {
    const row = signedMedia.find((m) => m.id === id)
    if (row) add(row, row.caption ?? mediaLabel(row))
  }

  for (const row of signedMedia) {
    if (out.length >= 8) break
    add(row, row.caption ?? mediaLabel(row))
  }

  if (memory?.successLooksLike && out[0]) {
    out[0] = { ...out[0], caption: out[0].caption ?? memory.successLooksLike }
  }

  return out.slice(0, 8)
}

function buildCertifications(
  standard: SearchableStandard,
  relatedModules: { id: string; title: string }[],
  portal: boolean
): AskRivetRelatedCertification[] {
  const capture = parseStandardsCapture(standard.standards_capture)
  const badge = capture?.trainingPack?.certificationBadge
  const certs: AskRivetRelatedCertification[] = []

  if (badge?.title) {
    const moduleId = capture?.trainingPack?.moduleId ?? relatedModules[0]?.id
    certs.push({
      moduleId: moduleId ?? standard.id,
      title: badge.title,
      description: badge.description ?? null,
      href: moduleId
        ? trainingHref(moduleId, portal)
        : portal
          ? "/learn/training"
          : "/training",
    })
  }

  return certs.slice(0, 3)
}

function lowConfidenceResponse(
  relatedModules: { id: string; title: string }[],
  portal: boolean,
  matchScore = 0
): AskRivetResponse {
  return {
    title: COPY.askRivet.lowConfidenceTitle,
    quickAnswer: COPY.askRivet.lowConfidenceAnswer,
    visualExample: null,
    videoUrl: null,
    mediaAttachments: [],
    commonMistakes: [],
    ownerNote: null,
    relatedModules: relatedModules.slice(0, 3).map((m) => ({
      id: m.id,
      title: m.title,
      href: trainingHref(m.id, portal),
    })),
    relatedCertifications: [],
    estimatedMinutes: null,
    standardId: null,
    standardHref: null,
    playTitle: null,
    matchedSource: null,
    confidence: "low",
    matchScore,
    confidenceScore: askRivetConfidenceScorePercent(matchScore),
    sourcePlay: null,
    sourceTraining: null,
    sourceLinks: [],
    sourcesSearched: SOURCES_SEARCHED,
    suggestCreatePlay: true,
  }
}

function buildPlayCitation(
  standard: SearchableStandard,
  topChunk: KnowledgeChunk | undefined,
  portal: boolean
): AskRivetSourceCitation {
  return {
    id: standard.id,
    title: standard.title,
    href: playHref(standard.id, portal),
    excerpt: topChunk?.text.slice(0, 200) ?? standard.description?.slice(0, 200) ?? standard.title,
    sourceType: topChunk?.source ?? "play",
  }
}

function buildTrainingCitation(
  relatedModules: { id: string; title: string }[],
  trainingChunk: KnowledgeChunk | undefined,
  portal: boolean
): AskRivetSourceCitation | null {
  const moduleId = trainingChunk?.moduleId ?? relatedModules[0]?.id
  const title = relatedModules.find((m) => m.id === moduleId)?.title ?? relatedModules[0]?.title
  if (!moduleId || !title) return null

  return {
    id: moduleId,
    title,
    href: trainingHref(moduleId, portal),
    excerpt: trainingChunk?.text.slice(0, 200) ?? title,
    sourceType: trainingChunk?.source ?? "training_module",
  }
}

export function buildAskRivetResponse(input: BuildResponseInput): AskRivetResponse {
  const { question, match, standard, signedMedia, relatedModules, portal = false } = input
  const matchScore = match?.score ?? 0

  if (!match || !standard || matchScore < ASK_RIVET_MATCH_THRESHOLD) {
    return lowConfidenceResponse(relatedModules, portal, matchScore)
  }

  const capture = parseStandardsCapture(standard.standards_capture)
  const memory = capture?.operationalMemory

  const faqHit = memory?.faqs?.find((f) =>
    question.toLowerCase().includes(f.question.toLowerCase().slice(0, 12))
  )

  const verificationChunk = match.topChunks.find((c) => c.source === "verification")
  const mistakeChunks = match.topChunks.filter(
    (c) => c.source === "common_mistake" || c.source === "new_hire_mistake"
  )
  const stepChunk = match.topChunks.find((c) => c.source === "step")
  const faqAnswerChunk = match.topChunks.find((c) => c.source === "faq_answer")
  const trainingChunk = match.topChunks.find((c) =>
    ["training_lesson", "training_objective", "training_module"].includes(c.source)
  )

  const sourcedAnswer =
    faqHit?.answer?.trim() ||
    faqAnswerChunk?.text.trim() ||
    verificationChunk?.text.trim() ||
    stepChunk?.text.trim() ||
    trainingChunk?.text.trim() ||
    memory?.successLooksLike?.trim() ||
    capture?.playInference?.successCriteria?.trim() ||
    null

  if (!sourcedAnswer || matchScore < ASK_RIVET_LOW_SCORE_THRESHOLD) {
    return lowConfidenceResponse(relatedModules, portal, matchScore)
  }

  const commonMistakes = [
    ...mistakeChunks.map((c) => c.text),
    ...(memory?.newHireMistakes ?? []),
    ...(capture?.playInference?.trainingGaps ?? []).slice(0, 2),
  ]
    .filter(Boolean)
    .slice(0, 5)

  const mediaAttachments = buildMediaAttachments(standard, signedMedia)
  const walkthroughId = capture?.walkthroughMediaId
  const videoUrl =
    mediaAttachments.find((m) => m.kind === "video")?.url ??
    mediaUrlForId(walkthroughId, signedMedia) ??
    null

  const visualAttachment = mediaAttachments.find((m) => m.kind === "photo" || m.kind === "video")
  const visualUrl = visualAttachment?.url ?? null

  const estFromSteps = (standard.standard_steps ?? [])
    .map((s) => s.estimated_time_minutes)
    .filter((n): n is number => n != null && n > 0)
  const estimatedMinutes =
    standard.estimated_time_minutes ??
    (estFromSteps.length ? estFromSteps.reduce((a, b) => a + b, 0) : null)

  const confidence = askRivetConfidenceTier(matchScore)
  const confidenceScore = askRivetConfidenceScorePercent(matchScore)
  const ownerNote = memory?.ownerNote?.trim() || memory?.ifNobodyAsks?.trim() || null
  const standardHref = playHref(standard.id, portal)
  const primaryChunk =
    stepChunk ?? faqAnswerChunk ?? verificationChunk ?? trainingChunk ?? match.topChunks[0]

  return {
    title: standard.title,
    quickAnswer: sourcedAnswer,
    visualExample: visualUrl
      ? {
          url: visualUrl,
          caption: visualAttachment?.caption ?? memory?.successLooksLike ?? "Reference",
          kind: visualAttachment?.kind === "video" ? "video" : "photo",
        }
      : null,
    videoUrl,
    mediaAttachments,
    commonMistakes,
    ownerNote,
    relatedModules: relatedModules.slice(0, 4).map((m) => ({
      id: m.id,
      title: m.title,
      href: trainingHref(m.id, portal),
    })),
    relatedCertifications: buildCertifications(standard, relatedModules, portal),
    estimatedMinutes,
    standardId: standard.id,
    standardHref,
    playTitle: standard.title,
    matchedSource: primaryChunk?.source ?? "play",
    confidence,
    matchScore,
    confidenceScore,
    sourcePlay: buildPlayCitation(standard, primaryChunk, portal),
    sourceTraining: buildTrainingCitation(relatedModules, trainingChunk, portal),
    sourceLinks: buildSourceLinks(standard.id, match.topChunks, portal),
    sourcesSearched: SOURCES_SEARCHED,
    suggestCreatePlay: false,
  }
}

export function trainingModulesForStandard(
  standardId: string,
  modules: Pick<Tables<"training_modules">, "id" | "title">[],
  items: { module_id: string; standard_id: string }[]
): { id: string; title: string }[] {
  const moduleIds = new Set(
    items.filter((i) => i.standard_id === standardId).map((i) => i.module_id)
  )
  return modules.filter((m) => moduleIds.has(m.id)).map((m) => ({ id: m.id, title: m.title }))
}

// Re-export thresholds for tests and UI
export {
  ASK_RIVET_HIGH_SCORE_THRESHOLD,
  ASK_RIVET_LOW_SCORE_THRESHOLD,
  ASK_RIVET_MATCH_THRESHOLD,
} from "./confidence"
