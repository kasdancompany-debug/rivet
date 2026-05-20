import { formatTrainingRole } from "@/lib/training/roles"
import type { StandardWithSteps } from "@/lib/db/queries"

export type StandardMarkdownMediaLine = {
  kind: "image" | "video" | "file"
  label: string
  /** Signed HTTP URL for images, or page-relative /api path, or plain URL */
  reference: string
}

export function buildStandardMarkdown(params: {
  businessName: string
  categoryLabel: string
  standardUrl: string
  sop: StandardWithSteps
  assignedRoleLabels: string[]
  mediaLines?: StandardMarkdownMediaLine[]
}): string {
  const { businessName, categoryLabel, standardUrl, sop, assignedRoleLabels, mediaLines } = params
  const lines: string[] = []
  const updated = new Date(sop.updated_at).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })

  lines.push(`# ${sop.title}`)
  lines.push("")
  lines.push(`**Business:** ${businessName}`)
  lines.push(`**Category:** ${categoryLabel}`)
  lines.push(`**Status:** Published`)
  lines.push(`**Last updated:** ${updated}`)
  lines.push(`**Live standard:** ${standardUrl}`)
  lines.push("")

  if (assignedRoleLabels.length > 0) {
    lines.push("## Role owner")
    lines.push("")
    for (const r of assignedRoleLabels) {
      lines.push(`- ${r}`)
    }
    lines.push("")
  }

  if (sop.description?.trim()) {
    lines.push("## Purpose")
    lines.push("")
    lines.push(sop.description.trim())
    lines.push("")
  }

  lines.push("## Steps")
  lines.push("")
  const steps = [...sop.standard_steps].sort((a, b) => a.step_order - b.step_order)
  for (let idx = 0; idx < steps.length; idx++) {
    const s = steps[idx]!
    lines.push(`### ${String(idx + 1).padStart(2, "0")}. ${s.title}`)
    if (s.requires_photo_confirmation) {
      lines.push("")
      lines.push("_Photo confirmation required._")
    }
    lines.push("")
    lines.push(s.instructions?.trim() || "_No instructions._")
    lines.push("")
    if (s.media_url?.trim()) {
      const mu = s.media_url.trim()
      if (mu.startsWith("/api/standard-media/")) {
        lines.push(
          `**Walkthrough:** Open the live standard and play the clip (${standardUrl}).`
        )
      } else {
        lines.push(`**Reference:** ${mu}`)
      }
      lines.push("")
    }
  }

  if (mediaLines?.length) {
    lines.push("## Attachments (snapshot)")
    lines.push("")
    lines.push(
      "_Image links below may expire; open the live standard for the latest files._"
    )
    lines.push("")
    for (const m of mediaLines) {
      lines.push(`- **${m.label}** (${m.kind})`)
      if (m.kind === "image" && m.reference.startsWith("http")) {
        lines.push(`  ![](${m.reference})`)
      } else {
        lines.push(`  ${m.reference}`)
      }
      lines.push("")
    }
  }

  lines.push("---")
  lines.push(`_Exported from Rivet · ${new Date().toISOString().slice(0, 10)}_`)
  return lines.join("\n")
}

export function standardMarkdownFilename(title: string): string {
  const base =
    title
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 64) || "standard"
  return `${base}.md`
}

export function assignedRolesDisplay(captureAssigned: string[] | undefined): string[] {
  if (!captureAssigned?.length) return []
  return captureAssigned.map((r) => formatTrainingRole(r))
}
