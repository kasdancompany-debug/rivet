import type { TrainingItemWithSop } from "@/lib/db/queries"
import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import { isImageMedia, isVideoMedia } from "@/lib/standards/standard-media-display"
import { extractAskRivetSearchText } from "@/lib/universal-search/extract-ask-text"
import type { UniversalSearchCorpus } from "@/lib/universal-search/corpus"
import { walkthroughMediaId } from "@/lib/universal-search/corpus"
import { passesSearchThreshold, scoreSearchMatch } from "@/lib/universal-search/score"
import {
  UNIVERSAL_SEARCH_KIND_ORDER,
  type UniversalSearchGroup,
  type UniversalSearchKind,
  type UniversalSearchLabels,
  type UniversalSearchResponse,
  type UniversalSearchResult,
} from "@/lib/universal-search/types"

const MAX_PER_KIND = 8

function pushResult(
  bucket: Map<UniversalSearchKind, UniversalSearchResult[]>,
  result: UniversalSearchResult
) {
  const list = bucket.get(result.kind) ?? []
  list.push(result)
  bucket.set(result.kind, list)
}

function trimBuckets(
  bucket: Map<UniversalSearchKind, UniversalSearchResult[]>,
  labels: UniversalSearchLabels
): UniversalSearchGroup[] {
  const groups: UniversalSearchGroup[] = []
  for (const kind of UNIVERSAL_SEARCH_KIND_ORDER) {
    const sorted = [...(bucket.get(kind) ?? [])].sort((a, b) => b.score - a.score).slice(0, MAX_PER_KIND)
    if (sorted.length === 0) continue
    groups.push({ kind, label: labels[kind], results: sorted })
  }
  return groups
}

export function runUniversalSearch(
  query: string,
  corpus: UniversalSearchCorpus,
  labels: UniversalSearchLabels
): UniversalSearchResponse {
  const q = query.trim()
  if (q.length < 2) {
    return { query: q, groups: [], totalCount: 0 }
  }

  const bucket = new Map<UniversalSearchKind, UniversalSearchResult[]>()

  for (const sop of corpus.standards) {
    const capture = parseStandardsCapture(sop.standards_capture)
    const stepText = (sop.standard_steps ?? [])
      .map((st) => `${st.title} ${st.instructions} ${st.verification ?? ""}`)
      .join(" ")
    const haystack = [
      sop.title,
      sop.description,
      sop.category,
      capture?.operationalMemory?.ownerNote,
      capture?.operationalMemory?.successLooksLike,
      stepText,
    ]
      .filter(Boolean)
      .join(" ")

    const score = scoreSearchMatch(haystack, q)
    if (!passesSearchThreshold(score)) continue

    pushResult(bucket, {
      id: sop.id,
      kind: "play",
      title: sop.title,
      subtitle: sop.status === "draft" ? "Draft play" : sop.category,
      href: `/sops/${sop.id}`,
      score,
    })
  }

  for (const mod of corpus.modules) {
    const itemTitles = (mod.training_items ?? [])
      .map((i: TrainingItemWithSop) => i.standards?.title)
      .filter(Boolean)
      .join(" ")
    const haystack = [mod.title, mod.description, mod.assigned_role, itemTitles].filter(Boolean).join(" ")
    const score = scoreSearchMatch(haystack, q)
    if (!passesSearchThreshold(score)) continue

    pushResult(bucket, {
      id: mod.id,
      kind: "training",
      title: mod.title,
      subtitle:
        mod.training_items && mod.training_items.length > 0
          ? `${mod.training_items.length} play(s) in module`
          : "Training module",
      href: `/training/modules/${mod.id}`,
      score,
    })
  }

  for (const media of corpus.media) {
    const playTitle = corpus.standardTitleById.get(media.standard_id) ?? "Play"
    const caption = media.caption ?? ""
    const haystack = `${playTitle} ${caption}`
    const score = scoreSearchMatch(haystack, q)
    if (!passesSearchThreshold(score)) continue

    if (isVideoMedia(media)) {
      pushResult(bucket, {
        id: media.id,
        kind: "video",
        title: caption.trim() || `Video · ${playTitle}`,
        subtitle: playTitle,
        href: `/sops/${media.standard_id}`,
        score,
      })
    } else if (isImageMedia(media)) {
      pushResult(bucket, {
        id: media.id,
        kind: "photo",
        title: caption.trim() || `Photo · ${playTitle}`,
        subtitle: playTitle,
        href: `/sops/${media.standard_id}`,
        score,
      })
    }
  }

  for (const sop of corpus.standards) {
    const mediaId = walkthroughMediaId(sop)
    if (!mediaId) continue
    const haystack = `${sop.title} walkthrough video operator`
    const score = scoreSearchMatch(haystack, q)
    if (!passesSearchThreshold(score)) continue
    pushResult(bucket, {
      id: `walkthrough-${sop.id}`,
      kind: "video",
      title: `Walkthrough · ${sop.title}`,
      subtitle: "Play walkthrough video",
      href: `/sops/${sop.id}`,
      score: score + 0.5,
    })
  }

  for (const row of corpus.askQueries) {
    const answerText = extractAskRivetSearchText(row.response)
    const playTitle = row.standard_id ? corpus.standardTitleById.get(row.standard_id) : null
    const haystack = [row.question_text, answerText, playTitle].filter(Boolean).join(" ")
    const score = scoreSearchMatch(haystack, q)
    if (!passesSearchThreshold(score)) continue

    pushResult(bucket, {
      id: row.id,
      kind: "ask_rivet",
      title: row.question_text,
      subtitle: playTitle ? `Answer · ${playTitle}` : "Ask Rivet answer",
      href: row.standard_id ? `/sops/${row.standard_id}` : "/ask",
      score,
    })
  }

  for (const profile of corpus.profiles) {
    const haystack = [profile.full_name, profile.email, profile.role].filter(Boolean).join(" ")
    const score = scoreSearchMatch(haystack, q)
    if (!passesSearchThreshold(score)) continue

    pushResult(bucket, {
      id: profile.id,
      kind: "employee",
      title: profile.full_name?.trim() || profile.email,
      subtitle: profile.role?.trim() || profile.email,
      href: `/training`,
      score,
    })
  }

  for (const cert of corpus.certifications) {
    const moduleTitle = corpus.moduleTitleById.get(cert.training_module_id) ?? "Training module"
    const employeeName = corpus.profileNameById.get(cert.employee_id) ?? "Team member"
    const status = cert.certified_at
      ? "Certified"
      : cert.manager_signed_off_at
        ? "Awaiting certification"
        : "In progress"
    const haystack = `${employeeName} ${moduleTitle} certification ${status}`
    const score = scoreSearchMatch(haystack, q)
    if (!passesSearchThreshold(score)) continue

    pushResult(bucket, {
      id: cert.id,
      kind: "certification",
      title: `${employeeName} · ${moduleTitle}`,
      subtitle: status,
      href: `/training/certificates/${cert.employee_id}/${cert.training_module_id}`,
      score,
    })
  }

  const groups = trimBuckets(bucket, labels)
  const totalCount = groups.reduce((n, g) => n + g.results.length, 0)

  return { query: q, groups, totalCount }
}
