import type { TypedSupabaseClient } from "@/types/database"

export async function ensurePlayTrainingModule(
  supabase: TypedSupabaseClient,
  input: {
    businessId: string
    standardId: string
    playTitle: string
    assignedRole: string | null
    existingModuleId?: string | null
  }
): Promise<string | null> {
  if (input.existingModuleId) {
    const { data: existing } = await supabase
      .from("training_modules")
      .select("id")
      .eq("id", input.existingModuleId)
      .eq("business_id", input.businessId)
      .maybeSingle()
    if (existing?.id) {
      await linkStandardToModule(supabase, existing.id as string, input.standardId)
      return existing.id as string
    }
  }

  const title = `${input.playTitle.trim()} — training`
  const { data: created, error } = await supabase
    .from("training_modules")
    .insert({
      business_id: input.businessId,
      title,
      description: `Auto-generated from play: ${input.playTitle.trim()}`,
      assigned_role: input.assignedRole,
    })
    .select("id")
    .single()

  if (error || !created?.id) return null
  const moduleId = created.id as string
  await linkStandardToModule(supabase, moduleId, input.standardId)
  return moduleId
}

async function linkStandardToModule(
  supabase: TypedSupabaseClient,
  moduleId: string,
  standardId: string
) {
  const { data: rows } = await supabase
    .from("training_items")
    .select("id")
    .eq("module_id", moduleId)
    .eq("standard_id", standardId)
    .limit(1)

  if (rows && rows.length > 0) return

  await supabase.from("training_items").insert({
    module_id: moduleId,
    standard_id: standardId,
    required: true,
  })
}
