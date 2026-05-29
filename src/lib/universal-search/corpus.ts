import type { StandardWithSteps, TrainingModuleDeep } from "@/lib/db/queries"
import { parseStandardsCapture } from "@/lib/standards-capture/parse"
import type { Tables } from "@/types/database"

export type UniversalSearchCorpus = {
  standards: StandardWithSteps[]
  modules: TrainingModuleDeep[]
  media: Tables<"standard_media">[]
  askQueries: Pick<
    Tables<"rivet_ask_queries">,
    "id" | "question_text" | "standard_id" | "response" | "created_at"
  >[]
  profiles: Tables<"profiles">[]
  certifications: Tables<"employee_module_certifications">[]
  standardTitleById: Map<string, string>
  moduleTitleById: Map<string, string>
  profileNameById: Map<string, string>
}

export function buildStandardTitleMap(standards: { id: string; title: string }[]): Map<string, string> {
  return new Map(standards.map((s) => [s.id, s.title]))
}

export function walkthroughMediaId(standard: Tables<"standards">): string | null {
  const capture = parseStandardsCapture(standard.standards_capture)
  return capture?.walkthroughMediaId?.trim() || null
}
