"use client"

import { useId, useState, useTransition } from "react"
import { Check, ExternalLink, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SCAN_SAVE_REPORT } from "@/lib/operational-scan/scan-copy"
import { cn } from "@/lib/utils"

export type SaveScanReportFields = {
  firstName: string
  email: string
  businessName: string
  phone: string
}

export function SaveScanReportCard({
  initialBusinessName = "",
  onSubmit,
  onResend,
  saved = false,
  savedEmail,
  reportUrl,
  error,
}: {
  initialBusinessName?: string
  onSubmit: (fields: SaveScanReportFields) => void | Promise<void>
  onResend?: () => void | Promise<void>
  saved?: boolean
  savedEmail?: string
  reportUrl?: string
  error?: string | null
}) {
  const firstNameId = useId()
  const emailId = useId()
  const businessId = useId()
  const phoneId = useId()
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")
  const [businessName, setBusinessName] = useState(initialBusinessName)
  const [phone, setPhone] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isResending, startResendTransition] = useTransition()

  const canSubmit =
    firstName.trim().length >= 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  if (saved) {
    return (
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/30 px-5 py-5 sm:px-6">
        <p className="text-sm font-semibold text-emerald-200">{SCAN_SAVE_REPORT.successTitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {SCAN_SAVE_REPORT.successBody}
          {savedEmail ? (
            <>
              {" "}
              <span className="font-medium text-emerald-300/90">{savedEmail}</span>
            </>
          ) : null}
        </p>
        {reportUrl ? (
          <p className="mt-3">
            <a
              href={reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300/90 hover:text-emerald-200"
            >
              {SCAN_SAVE_REPORT.viewReport}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </p>
        ) : null}
        {onResend ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isResending}
            className="mt-4 border-white/15 bg-transparent text-zinc-200 hover:bg-white/[0.06]"
            onClick={() => {
              startResendTransition(async () => {
                await onResend()
              })
            }}
          >
            {isResending ? (
              <>
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" aria-hidden />
                {SCAN_SAVE_REPORT.resending}
              </>
            ) : (
              SCAN_SAVE_REPORT.resend
            )}
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.1] bg-black/50 px-5 py-5 ring-1 ring-white/[0.04] sm:px-6 sm:py-6">
      <h3 className="text-lg font-semibold tracking-tight text-white">{SCAN_SAVE_REPORT.title}</h3>
      <p className="mt-1.5 text-sm text-zinc-400">{SCAN_SAVE_REPORT.hook}</p>

      <div className="mt-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Get</p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {SCAN_SAVE_REPORT.benefits.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
              <Check className="size-4 shrink-0 text-emerald-400/90" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <form
        className="mt-6 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          if (!canSubmit || isPending) return
          startTransition(async () => {
            await onSubmit({
              firstName: firstName.trim(),
              email: email.trim(),
              businessName: businessName.trim(),
              phone: phone.trim(),
            })
          })
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={firstNameId} className="text-zinc-300">
              {SCAN_SAVE_REPORT.firstNameLabel}
            </Label>
            <Input
              id={firstNameId}
              className="mt-1.5 h-10 border-white/10 bg-zinc-950/80 text-white"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              required
            />
          </div>
          <div>
            <Label htmlFor={emailId} className="text-zinc-300">
              {SCAN_SAVE_REPORT.emailLabel}
            </Label>
            <Input
              id={emailId}
              type="email"
              className="mt-1.5 h-10 border-white/10 bg-zinc-950/80 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={businessId} className="text-zinc-300">
              {SCAN_SAVE_REPORT.businessNameLabel}{" "}
              <span className="font-normal text-zinc-500">({SCAN_SAVE_REPORT.optional})</span>
            </Label>
            <Input
              id={businessId}
              className="mt-1.5 h-10 border-white/10 bg-zinc-950/80 text-white"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              autoComplete="organization"
            />
          </div>
          <div>
            <Label htmlFor={phoneId} className="text-zinc-300">
              {SCAN_SAVE_REPORT.phoneLabel}{" "}
              <span className="font-normal text-zinc-500">({SCAN_SAVE_REPORT.optional})</span>
            </Label>
            <Input
              id={phoneId}
              type="tel"
              className="mt-1.5 h-10 border-white/10 bg-zinc-950/80 text-white"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-md border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-200"
          >
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit || isPending}
          className={cn("h-11 w-full rounded-md bg-white text-[14px] font-semibold text-zinc-950 hover:bg-zinc-100")}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" data-icon="inline-start" aria-hidden />
              {SCAN_SAVE_REPORT.submitting}
            </>
          ) : (
            SCAN_SAVE_REPORT.submit
          )}
        </Button>
      </form>
    </div>
  )
}
