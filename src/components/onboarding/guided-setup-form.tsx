"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { createWorkspaceForCurrentUser } from "@/app/actions/workspace"
import { COPY } from "@/lib/interface-copy"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function GuidedSetupForm({
  postSetupHref = "/onboarding",
}: {
  postSetupHref?: "/subscribe" | "/onboarding"
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  function submit() {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError("Enter your business name (at least 2 characters).")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await createWorkspaceForCurrentUser(trimmed)
      if (!res.ok) {
        setError(res.message)
        return
      }
      router.push(postSetupHref)
      router.refresh()
    })
  }

  return (
    <div className="mx-auto max-w-lg space-y-10 pb-24">
      <div className="space-y-3 text-center sm:text-left">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {COPY.setup.eyebrow}
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {COPY.setup.title}
        </h1>
        <p className="text-pretty text-base leading-relaxed text-muted-foreground">{COPY.setup.lead}</p>
      </div>

      <Card className="overflow-hidden border-border/60 shadow-[0_1px_0_rgba(15,23,42,0.04),0_24px_64px_rgba(15,23,42,0.08)]">
        <CardHeader className="space-y-1 border-b border-border/40 bg-gradient-to-br from-muted/40 via-background to-background pb-6">
          <CardTitle className="text-lg">{COPY.setup.cardTitle}</CardTitle>
          <CardDescription className="text-sm leading-relaxed">{COPY.setup.cardDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          <div className="space-y-2">
            <Label htmlFor="biz-name" className="text-sm font-medium">
              {COPY.setup.nameLabel}
            </Label>
            <Input
              id="biz-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={COPY.setup.namePlaceholder}
              autoComplete="organization"
              className="h-11"
              disabled={pending}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit()
              }}
            />
          </div>

          {error ? (
            <p
              className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 border-t border-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {postSetupHref === "/subscribe" ? COPY.setup.footerHintBeforeCheckout : COPY.setup.footerHint}
            </p>
            <Button type="button" size="lg" className="h-11 shrink-0 px-8" disabled={pending} onClick={submit}>
              {pending ? COPY.setup.submitting : COPY.setup.submit}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
