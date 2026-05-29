"use client"

import { PlayMissionBrief } from "@/components/plays/play-mission-brief"

/** @deprecated Use PlayMissionBrief */
export function PlayContextStrip({
  operationalProblem,
  successCriteria,
}: {
  operationalProblem: string | null
  successCriteria: string | null
}) {
  return (
    <PlayMissionBrief operationalProblem={operationalProblem} successCriteria={successCriteria} />
  )
}
