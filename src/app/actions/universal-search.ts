"use server"

import { fetchBusinessForCurrentUser } from "@/lib/db/queries"
import { COPY } from "@/lib/interface-copy"
import { loadUniversalSearchCorpus } from "@/lib/universal-search/load-corpus"
import { runUniversalSearch } from "@/lib/universal-search/run-search"
import type { UniversalSearchLabels } from "@/lib/universal-search/types"
import type { UniversalSearchResponse } from "@/lib/universal-search/types"
import { createClient } from "@/lib/supabase/server"

const LABELS: UniversalSearchLabels = {
  play: COPY.universalSearch.groupPlays,
  training: COPY.universalSearch.groupTraining,
  video: COPY.universalSearch.groupVideos,
  photo: COPY.universalSearch.groupPhotos,
  ask_rivet: COPY.universalSearch.groupAskRivet,
  employee: COPY.universalSearch.groupEmployees,
  certification: COPY.universalSearch.groupCertifications,
}

export async function universalSearch(
  query: string
): Promise<
  | { ok: true; result: UniversalSearchResponse }
  | { ok: false; message: string }
> {
  try {
    const q = query.trim()
    if (q.length < 2) {
      return { ok: false, message: COPY.universalSearch.queryTooShort }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { ok: false, message: "You need to be signed in." }

    const business = await fetchBusinessForCurrentUser(supabase)
    if (!business) return { ok: false, message: "No business linked." }

    const corpus = await loadUniversalSearchCorpus(business.id, supabase)
    const result = runUniversalSearch(q, corpus, LABELS)

    return { ok: true, result }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Search failed." }
  }
}
