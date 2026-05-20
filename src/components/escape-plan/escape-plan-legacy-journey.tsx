"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { Check, Circle, Plus, Trash2 } from "lucide-react"

import {
  addOwnerEscapePlanMilestone,
  createOwnerEscapePlan,
  deleteOwnerEscapePlanMilestone,
  markOwnerEscapePlanStatus,
  toggleOwnerEscapePlanTask,
  updateOwnerEscapePlanTask,
} from "@/app/actions/escape-plan"
import { ESCAPE_PLAN_WEEK_META } from "@/lib/escape-plan/template"
import { escapePlanCompletionRatio, escapePlanProgressFromStart } from "@/lib/escape-plan/progress"
import type { Tables } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Plan = Tables<"owner_escape_plans">
type Task = Tables<"owner_escape_plan_tasks">

/** Original 4-week arc (plan_version === 1). */
export function EscapePlanLegacyJourney({
  plan,
  tasks,
  businessName,
}: {
  plan: Plan
  tasks: Task[]
  businessName: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { dayInArc, weekInArc, daysRemaining, isPastArc } = escapePlanProgressFromStart(plan.started_on)
  const ratio = escapePlanCompletionRatio(tasks)
  const doneCount = tasks.filter((t) => t.completed_at).length

  const [addWeek, setAddWeek] = useState<1 | 2 | 3 | 4 | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [addError, setAddError] = useState<string | null>(null)

  const isReadOnly = plan.status === "archived"

  function refresh() {
    router.refresh()
  }

  function onToggle(taskId: string, next: boolean) {
    startTransition(async () => {
      const res = await toggleOwnerEscapePlanTask(taskId, next)
      if (res.ok) refresh()
    })
  }

  function onMarkComplete() {
    startTransition(async () => {
      await markOwnerEscapePlanStatus(plan.id, "completed")
      refresh()
    })
  }

  function onStartNextArc() {
    startTransition(async () => {
      const res = await createOwnerEscapePlan({})
      if (res.ok) refresh()
    })
  }

  function submitAddMilestone() {
    if (!addWeek) return
    setAddError(null)
    startTransition(async () => {
      const res = await addOwnerEscapePlanMilestone({
        planId: plan.id,
        weekNumber: addWeek,
        title: newTitle,
        description: newDesc || null,
      })
      if (!res.ok) {
        setAddError(res.message)
        return
      }
      setNewTitle("")
      setNewDesc("")
      setAddWeek(null)
      refresh()
    })
  }

  return (
    <div className="space-y-12 pb-10 sm:space-y-14 sm:pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {businessName} · live roadmap
        </p>
        <div className="flex flex-wrap gap-2">
          {plan.status === "active" ? (
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onMarkComplete}>
              Mark arc complete
            </Button>
          ) : plan.status === "completed" ? (
            <Button type="button" size="sm" disabled={pending} onClick={onStartNextArc}>
              Begin next guided arc
            </Button>
          ) : null}
        </div>
      </div>

      {plan.status === "completed" ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-950 dark:text-emerald-200/95">
          This arc is marked complete. The record stays for your team. When you are ready, start
          the next cycle—each run archives the previous active plan automatically.
        </div>
      ) : null}

      <section
        className="rounded-xl border border-border/60 bg-card px-6 py-8 shadow-[0_1px_0_rgba(15,23,42,0.05),0_12px_32px_-8px_rgba(15,23,42,0.06)] sm:px-9 sm:py-9"
        aria-label="Progress"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Where you are in the arc
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-foreground sm:text-4xl">
              Day {dayInArc} of 30
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Calendar week {weekInArc} · {daysRemaining} day{daysRemaining === 1 ? "" : "s"} left
              {isPastArc ? " · past the 30-day window, still finishing proof" : ""}
            </p>
          </div>
          <div className="w-full max-w-xs sm:shrink-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Milestones cleared
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {doneCount}/{tasks.length}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/80">
              <div
                className="h-full rounded-full bg-foreground/75 transition-[width] duration-500"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="relative space-y-0">
        {ESCAPE_PLAN_WEEK_META.map((meta, idx) => {
          const weekTasks = tasks.filter((t) => t.week_number === meta.weekNumber)
          const isCurrent = weekInArc === meta.weekNumber && plan.status === "active"
          return (
            <section
              key={meta.weekNumber}
              className={cn(idx < ESCAPE_PLAN_WEEK_META.length - 1 && "pb-16")}
              aria-labelledby={`week-${meta.weekNumber}-title`}
            >
              <div
                className={cn(
                  "rounded-2xl border px-5 py-6 sm:px-7 sm:py-7",
                  isCurrent
                    ? "border-foreground/15 bg-card shadow-sm"
                    : "border-border/60 bg-muted/15"
                )}
              >
                <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Week {meta.weekNumber}
                </p>
                <h2
                  id={`week-${meta.weekNumber}-title`}
                  className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
                >
                  {meta.theme}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                  {meta.intent}
                </p>

                <ul className="mt-8 space-y-5">
                  {weekTasks.map((task) => (
                    <LegacyRoadmapTaskCard
                      key={task.id}
                      task={task}
                      readOnly={isReadOnly}
                      pending={pending}
                      onToggle={onToggle}
                      onRefresh={refresh}
                    />
                  ))}
                </ul>

                {!isReadOnly && plan.status === "active" ? (
                  <div className="mt-8 border-t border-border/50 pt-6">
                    {addWeek === meta.weekNumber ? (
                      <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-muted/15 p-4">
                        {addError ? <p className="text-sm text-destructive">{addError}</p> : null}
                        <div className="space-y-2">
                          <Label>Milestone title</Label>
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="What you will prove this week"
                            disabled={pending}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Detail (optional)</Label>
                          <Textarea
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            rows={3}
                            disabled={pending}
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" onClick={submitAddMilestone} disabled={pending}>
                            Add to week {meta.weekNumber}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setAddWeek(null)
                              setAddError(null)
                            }}
                            disabled={pending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setAddWeek(meta.weekNumber)
                          setNewTitle("")
                          setNewDesc("")
                          setAddError(null)
                        }}
                      >
                        <Plus className="size-3.5" aria-hidden />
                        Add milestone to this week
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function LegacyRoadmapTaskCard({
  task,
  readOnly,
  pending,
  onToggle,
  onRefresh,
}: {
  task: Task
  readOnly: boolean
  pending: boolean
  onToggle: (id: string, v: boolean) => void
  onRefresh: () => void
}) {
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description ?? "")
  const [notes, setNotes] = useState(task.notes ?? "")
  const [savePending, startSave] = useTransition()

  useEffect(() => {
    queueMicrotask(() => {
      setTitle(task.title)
      setDescription(task.description ?? "")
      setNotes(task.notes ?? "")
    })
  }, [task])

  const complete = Boolean(task.completed_at)
  const canDelete = Boolean(task.task_key?.startsWith("custom_"))

  function saveIfChanged() {
    const t = title.trim()
    const d = description.trim() || null
    const n = notes.trim() || null
    if (t === task.title && d === (task.description ?? null) && n === (task.notes ?? null)) return
    startSave(async () => {
      const res = await updateOwnerEscapePlanTask({
        taskId: task.id,
        title: t,
        description: d,
        notes: n,
      })
      if (res.ok) onRefresh()
    })
  }

  function remove() {
    if (!canDelete) return
    if (!window.confirm("Remove this milestone from your plan?")) return
    startSave(async () => {
      const res = await deleteOwnerEscapePlanMilestone(task.id)
      if (res.ok) onRefresh()
    })
  }

  return (
    <li>
      <Card className="border-border/50 bg-background/50 shadow-none">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
          <div className="flex shrink-0 items-start pt-0.5">
            <Checkbox
              checked={complete}
              disabled={readOnly || pending || savePending}
              onCheckedChange={(v) => onToggle(task.id, v === true)}
              className="mt-0.5"
              aria-label={`Mark complete: ${task.title}`}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={saveIfChanged}
                disabled={readOnly || pending}
                className={cn(
                  "h-auto border-transparent bg-transparent px-0 py-0 text-base font-semibold leading-snug shadow-none focus-visible:ring-0",
                  complete && "text-muted-foreground line-through decoration-muted-foreground/50"
                )}
              />
              {canDelete && !readOnly ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={remove}
                  disabled={pending || savePending}
                  aria-label="Remove milestone"
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : null}
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveIfChanged}
              disabled={readOnly || pending}
              rows={3}
              className={cn(
                "resize-y text-sm leading-relaxed",
                complete && "text-muted-foreground"
              )}
              placeholder="What “done” looks like on the floor"
            />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Personalize (optional)
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveIfChanged}
                disabled={readOnly || pending}
                rows={2}
                className="text-sm"
                placeholder="Names, dates, or context only your team would understand"
              />
            </div>
            {complete ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                Logged complete
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Circle className="size-3.5 opacity-50" aria-hidden />
                In motion
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  )
}
