import type { TrainingInviteChannel } from "@/types/database"

export function trainingPortalInviteUrl(token: string, origin?: string): string {
  const base = (origin ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "")
  return `${base}/learn/join/${token}`
}

export function buildInviteMailtoLink(params: {
  url: string
  moduleTitle: string
  businessName: string
  recipientEmail?: string | null
}): string {
  const subject = encodeURIComponent(`Training: ${params.moduleTitle}`)
  const body = encodeURIComponent(
    `${params.businessName} assigned you training: ${params.moduleTitle}\n\nOpen Training Center on your phone:\n${params.url}\n\nComplete the plays before your next shift.`
  )
  const to = params.recipientEmail?.trim() ? encodeURIComponent(params.recipientEmail.trim()) : ""
  return to ? `mailto:${to}?subject=${subject}&body=${body}` : `mailto:?subject=${subject}&body=${body}`
}

export function buildInviteSmsLink(params: {
  url: string
  moduleTitle: string
  businessName: string
  recipientPhone?: string | null
}): string {
  const body = encodeURIComponent(
    `${params.businessName}: complete "${params.moduleTitle}" training → ${params.url}`
  )
  const phone = params.recipientPhone?.replace(/\D/g, "") ?? ""
  return phone ? `sms:${phone}?&body=${body}` : `sms:?&body=${body}`
}

export function channelLabel(channel: TrainingInviteChannel): string {
  switch (channel) {
    case "email":
      return "Email"
    case "sms":
      return "SMS"
    default:
      return "Invite link"
  }
}
