"use client"

import { CaptureStandardForm } from "@/components/sops/capture-standard-form"

/** @deprecated Prefer importing `CaptureStandardForm` directly. */
export function StandardsCaptureForm(props: { businessId: string }) {
  return <CaptureStandardForm businessId={props.businessId} />
}
