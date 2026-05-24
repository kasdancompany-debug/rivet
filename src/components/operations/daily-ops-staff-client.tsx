"use client"

import { useRouter } from "next/navigation"
import { useCallback, useState, useTransition } from "react"
import { AlertTriangle, Check, Camera } from "lucide-react"

import {
  clearRunItemPhoto,
  completeShift,
  reportShiftIssue,
  setRunItemPhotoPlaceholder,
  startTodayRun,
  toggleRunItem,
  updateRunItemNote,
  updateRunShiftNotes,
} from "@/app/actions/daily-ops"
import { COPY } from "@/lib/interface-copy"
import { hasPhotoConfirmed, isPhotoPending } from "@/lib/daily-ops/photos"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import type {
  StaffChecklistLine,
  StaffChecklistPack,
  StaffRunItem,
} from "@/lib/daily-ops/staff-pack"
import { cn } from "@/lib/utils"

type Tab = "opening" | "closing"

function itemForLine(pack: StaffChecklistPack, lineId: string): StaffRunItem | undefined {
  return pack.runItems.find((r) => r.checklist_item_id === lineId)
}

type RunAction = <T>(fn: () => Promise<T>, onOk?: () => void) => void

function ShiftNotesSection({
  runId,
  initialNotes,
  pending,
  runAction,
}: {
  runId: string
  initialNotes: string | null
  pending: boolean
  runAction: RunAction
}) {
  const [draft, setDraft] = useState(initialNotes ?? "")

  return (
    <section className="space-y-2 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <Label htmlFor="shift-notes" className="text-base">
        Shift notes
      </Label>
      <Textarea
        id="shift-notes"
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Anything the next shift should know"
        className="resize-none rounded-xl text-base"
      />
      <Button
        type="button"
        variant="secondary"
        className="w-full rounded-xl"
        disabled={pending}
        onClick={() => runAction(() => updateRunShiftNotes(runId, draft))}
      >
        Save shift notes
      </Button>
    </section>
  )
}

function RunLineCard({
  line,
  hit,
  locked,
  pending,
  runAction,
}: {
  line: StaffChecklistLine
  hit: StaffRunItem | undefined
  locked: boolean
  pending: boolean
  runAction: RunAction
}) {
  const [note, setNote] = useState(hit?.note ?? "")
  const completed = Boolean(hit?.completed)

  return (
    <li
      className={cn(
        "rounded-2xl border border-border/60 bg-card p-4 shadow-sm",
        completed && "border-primary/25 bg-primary/[0.03]"
      )}
    >
      <div className="flex gap-3">
        <button
          type="button"
          disabled={pending || locked || !hit}
          aria-pressed={completed}
          aria-label={completed ? "Mark not done" : "Mark done"}
          onClick={() => {
            if (!hit) return
            runAction(() => toggleRunItem(hit.id, !completed))
          }}
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 transition-colors",
            completed
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-muted/40 text-muted-foreground",
            (locked || !hit) && "opacity-40"
          )}
        >
          {completed ? <Check className="size-7 stroke-[3]" aria-hidden /> : null}
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-lg font-medium leading-snug">{line.text}</p>
          {line.required_photo ? (
            <p className="text-xs text-muted-foreground">Photo confirmation requested</p>
          ) : null}
          {hit && !locked ? (
            <div className="space-y-2">
              <Textarea
                rows={2}
                placeholder="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[72px] resize-none rounded-xl text-base"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={pending}
                  onClick={() => runAction(() => updateRunItemNote(hit.id, note))}
                >
                  Save note
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  disabled={pending || hasPhotoConfirmed(hit.photo_url)}
                  onClick={() =>
                    runAction(() =>
                      isPhotoPending(hit.photo_url)
                        ? clearRunItemPhoto(hit.id)
                        : setRunItemPhotoPlaceholder(hit.id)
                    )
                  }
                >
                  <Camera className="mr-1 size-4" aria-hidden />
                  {isPhotoPending(hit.photo_url)
                    ? "Undo pending mark"
                    : hasPhotoConfirmed(hit.photo_url)
                      ? "Photo on file"
                      : "Mark photo pending"}
                </Button>
              </div>
              {hasPhotoConfirmed(hit.photo_url) ? (
                <p className="text-xs text-muted-foreground">Photo file is saved on the checklist; replacing it uses the same link until uploads are enabled.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </li>
  )
}

export function DailyOpsStaffClient({
  opening,
  closing,
  shiftDateLabel,
}: {
  opening: StaffChecklistPack | null
  closing: StaffChecklistPack | null
  shiftDateLabel: string
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(() => {
    if (opening) return "opening"
    if (closing) return "closing"
    return "opening"
  })
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<string | null>(null)

  const both = Boolean(opening && closing)
  const displayTab: Tab = both ? tab : opening ? "opening" : "closing"
  const pack = displayTab === "opening" ? opening! : closing!
  const locked = !pack.run || pack.run.status === "completed"

  const [issueOpen, setIssueOpen] = useState(false)
  const [issueTitle, setIssueTitle] = useState("")
  const [issueBody, setIssueBody] = useState("")

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  function runAction<T>(fn: () => Promise<T>, onOk?: () => void) {
    setBanner(null)
    startTransition(async () => {
      const res = await fn()
      if (res && typeof res === "object" && "ok" in res && res.ok === false) {
        setBanner("message" in res ? String((res as { message: string }).message) : "Something failed.")
        return
      }
      onOk?.()
      refresh()
    })
  }

  if (!opening && !closing) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border/80 bg-muted/20 px-5 py-12 text-center text-sm text-muted-foreground">
        Opening and closing checklists are not set up for this business yet. Ask a manager to open Daily
        Operations once so defaults can be created.
      </div>
    )
  }

  const total = pack.lines.length
  const done = pack.lines.filter((l) => itemForLine(pack, l.id)?.completed).length

  return (
    <div className="mx-auto w-full max-w-md space-y-5 pb-28">
      <header className="space-y-1 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Daily ops</p>
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="text-sm text-muted-foreground">{shiftDateLabel}</p>
      </header>

      {both ? (
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted/80 p-1">
          <button
            type="button"
            onClick={() => setTab("opening")}
            className={cn(
              "rounded-xl py-3 text-base font-semibold transition-colors",
              displayTab === "opening" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            Opening
          </button>
          <button
            type="button"
            onClick={() => setTab("closing")}
            className={cn(
              "rounded-xl py-3 text-base font-semibold transition-colors",
              displayTab === "closing" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            Closing
          </button>
        </div>
      ) : null}

      {banner ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-center text-sm text-destructive">
          {banner}
        </p>
      ) : null}

      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-sm">
        <span className="text-sm text-muted-foreground">Progress</span>
        <span className="text-lg font-semibold tabular-nums">
          {done}/{total}
        </span>
      </div>

      {!pack.run ? (
        <Button
          type="button"
          size="lg"
          className="h-14 w-full rounded-2xl text-lg"
          disabled={pending}
          onClick={() =>
            runAction(() => startTodayRun(pack.checklistId), () => setBanner(null))
          }
        >
          Start {pack.title.toLowerCase()}
        </Button>
      ) : null}

      <ul className="space-y-3">
        {pack.lines.map((line) => {
          const hit = itemForLine(pack, line.id)
          return (
            <RunLineCard
              key={`${line.id}-${hit?.id ?? "none"}`}
              line={line}
              hit={hit}
              locked={locked}
              pending={pending}
              runAction={runAction}
            />
          )
        })}
      </ul>

      {pack.run && !locked ? (
        <ShiftNotesSection
          key={pack.run.id}
          runId={pack.run.id}
          initialNotes={pack.run.notes}
          pending={pending}
          runAction={runAction}
        />
      ) : null}

      {pack.run && pack.run.status === "completed" ? (
        <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-center text-sm font-medium text-emerald-900 dark:text-emerald-200/95">
          This checklist is complete for today.
        </p>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
        <div className="mx-auto flex max-w-md flex-col gap-2 sm:static">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-2xl border-destructive/25 text-base"
            disabled={pending || !pack.run}
            onClick={() => setIssueOpen(true)}
          >
            <AlertTriangle className="mr-2 size-4" aria-hidden />
            Report issue
          </Button>
          <Button
            type="button"
            size="lg"
            className="h-14 w-full rounded-2xl text-lg font-semibold"
            disabled={pending || !pack.run || locked}
            onClick={() => {
              const incomplete = pack.lines.filter((l) => !itemForLine(pack, l.id)?.completed)
              if (
                incomplete.length > 0 &&
                !window.confirm(
                  `${incomplete.length} item(s) still open. Mark this shift complete anyway?`
                )
              ) {
                return
              }
              runAction(() => completeShift(pack.run!.id))
            }}
          >
            Mark shift complete
          </Button>
        </div>
      </div>

      <Sheet open={issueOpen} onOpenChange={setIssueOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl px-4 pt-6 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Report an issue</SheetTitle>
            <SheetDescription>
              {COPY.issues.shiftReportHint}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-1 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="issue-title">What happened?</Label>
              <Input
                id="issue-title"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="Short title"
                className="h-11 rounded-xl text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issue-desc">Details (optional)</Label>
              <Textarea
                id="issue-desc"
                value={issueBody}
                onChange={(e) => setIssueBody(e.target.value)}
                rows={3}
                className="rounded-xl text-base"
              />
            </div>
          </div>
          <SheetFooter className="pb-6">
            <Button
              type="button"
              className="w-full rounded-xl"
              disabled={pending || !pack.run}
              onClick={() => {
                if (!pack.run) return
                runAction(async () => {
                  const res = await reportShiftIssue({
                    runId: pack.run!.id,
                    title: issueTitle,
                    description: issueBody,
                  })
                  if (res.ok) {
                    setIssueTitle("")
                    setIssueBody("")
                    setIssueOpen(false)
                  }
                  return res
                })
              }}
            >
              Submit
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
