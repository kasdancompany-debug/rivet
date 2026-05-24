"use client"

import { useState, useTransition } from "react"
import { Check, Copy, Link2, Mail, MessageSquare } from "lucide-react"

import { createTrainingPortalInvite } from "@/app/actions/training-portal"
import {
  buildInviteMailtoLink,
  buildInviteSmsLink,
  channelLabel,
} from "@/lib/training/portal/invite-links"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { TrainingInviteChannel } from "@/types/database"

type TeamMember = { id: string; full_name: string; email?: string | null }

export function TrainingPortalInvitePanel({
  businessId,
  moduleId,
  moduleTitle,
  businessName,
  team,
}: {
  businessId: string
  moduleId: string
  moduleTitle: string
  businessName: string
  team: TeamMember[]
}) {
  const [pending, startTransition] = useTransition()
  const [employeeId, setEmployeeId] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [lastUrl, setLastUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function createInvite(channel: TrainingInviteChannel) {
    setError(null)
    startTransition(async () => {
      const res = await createTrainingPortalInvite({
        businessId,
        moduleId,
        employeeId: employeeId || null,
        recipientEmail: email || null,
        recipientPhone: phone || null,
        channel,
      })
      if (!res.ok) {
        setError(res.message)
        return
      }
      setLastUrl(res.url)
      if (channel === "email") {
        window.location.href = buildInviteMailtoLink({
          url: res.url,
          moduleTitle,
          businessName,
          recipientEmail: email,
        })
      } else if (channel === "sms") {
        window.location.href = buildInviteSmsLink({
          url: res.url,
          moduleTitle,
          businessName,
          recipientPhone: phone,
        })
      }
    })
  }

  async function copyLink() {
    if (!lastUrl) return
    await navigator.clipboard.writeText(lastUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-muted/15 p-4">
      <h3 className="text-sm font-semibold text-foreground">{COPY.trainingPortal.inviteHeading}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{COPY.trainingPortal.inviteHint}</p>

      <div className="mt-4 space-y-3">
        <div className="space-y-1">
          <Label htmlFor={`invite-employee-${moduleId}`}>{COPY.trainingPortal.inviteEmployee}</Label>
          <select
            id={`invite-employee-${moduleId}`}
            value={employeeId}
            onChange={(e) => {
              const id = e.target.value
              setEmployeeId(id)
              const member = team.find((t) => t.id === id)
              if (member?.email) setEmail(member.email)
            }}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="">{COPY.trainingPortal.inviteAnyone}</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor={`invite-email-${moduleId}`}>{COPY.trainingPortal.inviteEmail}</Label>
            <input
              id={`invite-email-${moduleId}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`invite-phone-${moduleId}`}>{COPY.trainingPortal.invitePhone}</Label>
            <input
              id={`invite-phone-${moduleId}`}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 0100"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            />
          </div>
        </div>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" disabled={pending} onClick={() => createInvite("link")}>
          <Link2 className="size-4" aria-hidden />
          {COPY.trainingPortal.inviteCopyLink}
        </Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => createInvite("email")}>
          <Mail className="size-4" aria-hidden />
          {COPY.trainingPortal.inviteEmailBtn}
        </Button>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => createInvite("sms")}>
          <MessageSquare className="size-4" aria-hidden />
          {COPY.trainingPortal.inviteSmsBtn}
        </Button>
      </div>

      {lastUrl ? (
        <div className="mt-4 rounded-xl border border-border/50 bg-background px-3 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            {channelLabel("link")} ready
          </p>
          <p className="mt-1 break-all text-xs text-foreground">{lastUrl}</p>
          <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => void copyLink()}>
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? COPY.trainingPortal.inviteCopied : COPY.trainingPortal.inviteCopy}
          </Button>
        </div>
      ) : null}
    </section>
  )
}
