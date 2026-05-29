import type { PlayTrainingPack } from "@/lib/training/generate-training-pack"
import type { TypedSupabaseClient } from "@/types/database"

/** Keep Training Center module metadata aligned with the generated pack. */
export async function syncTrainingModuleFromPack(
  supabase: TypedSupabaseClient,
  input: {
    moduleId: string
    playTitle: string
    pack: PlayTrainingPack
    assignedRole: string | null
  }
): Promise<void> {
  const summary =
    input.pack.learningObjectives.slice(0, 2).join(" · ") ||
    `Auto-generated from play: ${input.playTitle.trim()}`

  await supabase
    .from("training_modules")
    .update({
      title: `${input.playTitle.trim()} — training`,
      description: summary.slice(0, 500),
      assigned_role: input.assignedRole,
    })
    .eq("id", input.moduleId)
}
