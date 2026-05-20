"use server"

import { revalidatePath } from "next/cache"

import {
  fetchBusinessForCurrentUser,
  insertDependencyAssessment,
} from "@/lib/db/queries"
import { createClient } from "@/lib/supabase/server"
import { seedStarterStandardsIfEmpty } from "@/app/actions/onboarding-seed"
import type { Json } from "@/types/database"

export async function persistFounderDependencyScan(payload: {
  dependencyPercent: number
  assessmentJson: Json
}): Promise<
  | { ok: true }
  | { ok: false; reason: "no_business" | "save_failed" | "error" }
> {
  try {
    const supabase = await createClient()
    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) {
      return { ok: false, reason: "no_business" }
    }

    const independence = Math.max(
      0,
      Math.min(100, 100 - Math.round(payload.dependencyPercent))
    )

    const row = await insertDependencyAssessment(
      {
        business_id: business.id,
        score: independence,
        assessment_json: payload.assessmentJson,
      },
      supabase
    )

    if (!row) {
      return { ok: false, reason: "save_failed" }
    }

    const seed = await seedStarterStandardsIfEmpty()
    if (!seed.ok && process.env.NODE_ENV !== "production") {
      console.error("[persistFounderDependencyScan] starter seed:", seed.message)
    }

    revalidatePath("/dashboard")
    revalidatePath("/founder-dependency")
    revalidatePath("/onboarding")
    return { ok: true }
  } catch {
    return { ok: false, reason: "error" }
  }
}
