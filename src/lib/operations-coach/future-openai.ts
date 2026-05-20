import type { CoachBrief, OperationsCoachPromptPack } from "@/lib/operations-coach/types"

/**
 * When you add OpenAI (or another provider), call `completion` with the two strings
 * from `buildOperationsCoachPromptPack`. Map the model reply into `CoachBrief` using
 * JSON mode / structured outputs, or a small parser—keep `CoachBrief` as your UI contract.
 */
export type CoachCompletionFn = (system: string, user: string) => Promise<string>

export type RunCoachWithAiParams = {
  promptPack: OperationsCoachPromptPack
  completion: CoachCompletionFn
  /** Optional: parse model text into the same shape the mock engine returns. */
  parseBrief?: (assistantText: string) => CoachBrief
}

export async function runCoachWithAiProvider(
  params: RunCoachWithAiParams
): Promise<string> {
  return params.completion(params.promptPack.system, params.promptPack.user)
}
