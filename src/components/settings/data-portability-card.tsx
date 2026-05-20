"use client"

import { useState } from "react"
import { Download, Upload } from "lucide-react"

import { BUSINESS_EXPORT_FILE_EXTENSION } from "@/lib/business-export"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Props = {
  hasWorkspace: boolean
}

export function DataPortabilityCard({ hasWorkspace }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function downloadExport() {
    setError(null)
    setBusy(true)
    try {
      const res = await fetch("/api/export/business-data", { method: "GET", cache: "no-store" })
      if (res.status === 401) {
        window.location.href = "/login"
        return
      }
      if (!res.ok) {
        let msg = `Export failed (${res.status})`
        try {
          const j = (await res.json()) as { message?: string }
          if (j.message) msg = j.message
        } catch {
          /* ignore */
        }
        setError(msg)
        return
      }
      const blob = await res.blob()
      const cd = res.headers.get("Content-Disposition")
      let filename = `rivet-business-export${BUSINESS_EXPORT_FILE_EXTENSION}`
      const m = cd?.match(/filename="([^"]+)"/)
      if (m?.[1]) filename = m[1]
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.rel = "noopener"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg">Data portability</CardTitle>
        <CardDescription>
          Download a versioned JSON snapshot of your business for backups and future desktop import.
          The file is normal JSON ({BUSINESS_EXPORT_FILE_EXTENSION} keeps the type obvious on disk).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {!hasWorkspace ? (
          <p className="text-sm text-muted-foreground">
            After you create a workspace in the card above, export runs against that business in Supabase.
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-3 border-t border-border/60 pt-6">
        <Button
          type="button"
          onClick={() => void downloadExport()}
          disabled={!hasWorkspace || busy}
        >
          <Download className="mr-2 size-4" aria-hidden />
          {busy ? "Preparing…" : "Export data (JSON)"}
        </Button>
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            variant="outline"
            disabled
            className="cursor-not-allowed opacity-70"
            title="Import will validate schema version and remap IDs — not wired yet."
          >
            <Upload className="mr-2 size-4" aria-hidden />
            Import data
          </Button>
          <span className="text-xs text-muted-foreground">
            Import stays disabled until the server route validates uploads; use export to move data today.
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
