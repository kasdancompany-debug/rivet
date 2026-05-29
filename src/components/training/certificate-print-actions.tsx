"use client"

import { Download, Printer } from "lucide-react"

import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"

export function CertificatePrintActions({
  fileName,
  showExport = true,
}: {
  fileName: string
  showExport?: boolean
}) {
  function handlePrint() {
    document.title = fileName
    window.print()
  }

  return (
    <div className="certificate-print-actions flex flex-wrap gap-2 print:hidden">
      <Button type="button" variant="default" onClick={handlePrint}>
        <Printer className="size-4" aria-hidden />
        {COPY.certifications.printButton}
      </Button>
      {showExport ? (
        <Button type="button" variant="outline" onClick={handlePrint}>
          <Download className="size-4" aria-hidden />
          {COPY.certifications.exportButton}
        </Button>
      ) : null}
    </div>
  )
}
