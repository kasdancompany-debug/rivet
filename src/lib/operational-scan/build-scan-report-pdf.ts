import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

import { formatAbsenceDays } from "@/lib/escape-readiness/absence-capacity"
import type { StoredScanReportPayload } from "@/lib/operational-scan/scan-report-types"
import { formatCurrencyCad, formatSeverityLabel } from "@/lib/operational-scan/score"

function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ""
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxChars) {
      if (line) lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function buildScanReportPdf(payload: StoredScanReportPayload): Promise<Uint8Array> {
  const { answers, result, fixes, generatedAt } = payload
  const business = answers.businessName.trim() || `${answers.firstName.trim()}'s business`
  const reportDate = new Date(generatedAt).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const doc = await PDFDocument.create()
  const page = doc.addPage([612, 792])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const margin = 48
  let y = 752

  const draw = (text: string, size: number, bold = false) => {
    page.drawText(text, {
      x: margin,
      y,
      size,
      font: bold ? fontBold : font,
      color: rgb(0.12, 0.12, 0.14),
    })
    y -= size + 8
  }

  draw("RIVET · OWNER DEPENDENCY REPORT", 9, true)
  y -= 4
  draw(business, 18, true)
  draw(reportDate, 10)
  y -= 12

  draw(`Owner Dependency Risk: ${result.ownerDependencyScore}/100`, 14, true)
  draw(`Risk level: ${formatSeverityLabel(result.severity)}`, 12)
  draw(`Owner-free capacity: ${formatAbsenceDays(result.estimatedOwnerFreeDays)}`, 11)
  y -= 8
  draw(`Est. interrupts / month: ~${result.estimatedInterruptionsPerMonth}`, 11)
  draw(`Est. owner hours lost / month: ~${result.estimatedOwnerHoursLostPerMonth}h`, 11)
  draw(`Est. annual cost: ${formatCurrencyCad(result.estimatedAnnualCost)}`, 11)
  y -= 12

  draw("Your first three fixes", 12, true)
  fixes.forEach((fix, i) => {
    const lines = wrapLines(`${i + 1}. ${fix}`, 78)
    for (const line of lines) {
      if (y < 72) return
      draw(line, 10)
    }
    y -= 4
  })

  page.drawText("Directional model from your answers · rivet.app", {
    x: margin,
    y: 36,
    size: 8,
    font,
    color: rgb(0.45, 0.45, 0.5),
  })

  return doc.save()
}
