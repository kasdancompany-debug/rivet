"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import {
  AlertTriangle,
  Check,
  Circle,
  FileText,
  Flag,
  ListTodo,
  Plus,
  Trash2,
  Users,
} from "lucide-react"

import {
  addOwnerEscapePlanMilestone,
  createOwnerEscapePlan,
  deleteOwnerEscapePlanMilestone,
  markOwnerEscapePlanStatus,
  toggleOwnerEscapePlanTask,
  updateOwnerEscapePlanTask,
} from "@/app/actions/escape-plan"
import { GUIDED_ESCAPE_PHASES } from "@/lib/escape-plan/guided-phase-meta"
import {
  HOURS_OPTIONS,
  TEAM_SIZE_OPTIONS,
  parseEscapePlanIntake,
} from "@/lib/escape-plan/guided-types"
import {
  escapePlanCompletionRatio,
  escapePlanGuidedCalendarProgress,
  escapePlanGuidedWorkPhase,
} from "@/lib/escape-plan/progress"
import type { EscapePlanTaskItemKind, Tables } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Plan = Tables<"owner_escape_plans">
type Task = Tables<"owner_escape_plan_tasks">

function kindPresentation(kind: EscapePlanTaskItemKind): {
  label: string
  className: string
  Icon: typeof Flag
} {
  switch (kind) {
    case "milestone":
      return {
        label: "Milestone",
        className: "border-sky-500/30 bg-sky-500/[0.08] text-sky-950 dark:text-sky-200/95",
        Icon: Flag,
      }
    case "staff_assignment":
      return {
        label: "Staff",
        className: "border-violet-500/30 bg-violet-500/[0.07] text-violet-950 dark:text-violet-200/95",
        Icon: Users,
      }
    case "standard_doc":
      return {
        label: "Standard",
        className: "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-950 dark:text-emerald-200/95",
        Icon: FileText,
      }
    case "risk_warning":
      return {
        label: "Risk",
        className: "border-amber-500/35 bg-amber-500/[0.08] text-amber-950 dark:text-amber-200/95",
        Icon: AlertTriangle,
      }
    default:
      return {
        label: "Task",
        className: "border-border/70 bg-muted/40 text-foreground",
        Icon: ListTodo,
      }
  }
}

export function EscapePlanGuidedJourney({
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
  const { dayInArc, daysRemaining, calendarPhase, isPastArc } = escapePlanGuidedCalendarProgress(
    plan.started_on
  )
  const workPhase = escapePlanGuidedWorkPhase(tasks)
  const ratio = escapePlanCompletionRatio(tasks)
  const doneCount = tasks.filter((t) => t.completed_at).length
  const intake = parseEscapePlanIntake(plan.intake_json)
  const hoursLabel = HOURS_OPTIONS.find((o) => o.value === intake.hoursBand)?.label ?? intake.hoursBand
  const teamLabel = TEAM_SIZE_OPTIONS.find((o) => o.value === intake.teamSizeBand)?.label ?? intake.teamSizeBand

  const [addWeek, setAddWeek] = useState<1 | 2 | 3 | 4 | 5 | 6 | null>(null)
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
    <div className="space-y-10 pb-12 sm:space-y-12 sm:pb-14">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/25 px-6 py-10 shadow-[0_1px_0_rgba(15,23,42,0.06),0_20px_50px_-20px_rgba(15,23,42,0.12)] sm:px-10 sm:py-11">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {businessName} · guided installation
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl sm:leading-tight">
              Installing management infrastructure into the business.
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
              You answered how the operation actually feels. Below is a phased transition roadmap—not
              feature busywork. Work it in order where you can, but always favor finishing a phase over
              starting three.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="outline" className="font-medium">
                Calendar phase ~{calendarPhase} of 6
              </Badge>
              <Badge variant="outline" className="font-medium">
                Work focus: phase {workPhase}
              </Badge>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 rounded-xl border border-border/50 bg-background/60 p-5 sm:max-w-xs">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Overall install progress
            </p>
            <p className="text-3xl font-semibold tabular-nums text-foreground">
              {doneCount}/{tasks.length}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-muted/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-foreground/50 to-foreground/80 transition-[width] duration-500"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Day {dayInArc} of 90 on the calendar arc
              {isPastArc ? " — past window, still closing proof." : ` · ${daysRemaining} days left on the arc.`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Intake snapshot: {hoursLabel} · {teamLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          {plan.status === "active" ? (
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onMarkComplete}>
              Mark roadmap complete
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
          This roadmap is marked complete. The record stays for your team. Start the next arc when you
          are ready to install the next layer—each run archives the previous active plan.
        </div>
      ) : null}

      <div className="space-y-14">
        {GUIDED_ESCAPE_PHASES.map((meta, idx) => {
          const phaseTasks = tasks.filter((t) => t.week_number === meta.phase).sort((a, b) => a.sort_order - b.sort_order)
          const phaseDone = phaseTasks.filter((t) => t.completed_at).length
          const phaseRatio = phaseTasks.length ? phaseDone / phaseTasks.length : 0
          const isWorkFocus = workPhase === meta.phase && plan.status === "active"
          const isCalendarHere = calendarPhase === meta.phase && plan.status === "active"

          return (
            <section
              key={meta.phase}
              className={cn(idx < GUIDED_ESCAPE_PHASES.length - 1 && "border-b border-border/40 pb-14")}
              aria-labelledby={`phase-${meta.phase}-title`}
            >
              <div
                className={cn(
                  "rounded-2xl border px-5 py-6 sm:px-8 sm:py-8",
                  isWorkFocus || isCalendarHere
                    ? "border-foreground/18 bg-card shadow-md"
                    : "border-border/55 bg-muted/10"
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Phase {meta.phase} of 6 · {meta.cadenceLabel}
                    </p>
                    <h3
                      id={`phase-${meta.phase}-title`}
                      className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
                    >
                      {meta.title}
                    </h3>
                    <p className="text-sm font-medium text-foreground/85">{meta.tagline}</p>
                    <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
                      {meta.intent}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-lg border border-border/50 bg-background/70 px-4 py-3 text-right">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-wide text-muted-foreground">
                      Phase progress
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                      {phaseDone}/{phaseTasks.length}
                    </p>
                    <div className="mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-muted/80 sm:ml-auto">
                      <div
                        className="h-full rounded-full bg-foreground/70"
                        style={{ width: `${Math.round(phaseRatio * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <ul className="mt-8 space-y-4">
                  {phaseTasks.map((task) => (
                    <GuidedRoadmapTaskCard
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
                    {addWeek === meta.phase ? (
                      <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-muted/15 p-4">
                        {addError ? <p className="text-sm text-destructive">{addError}</p> : null}
                        <div className="space-y-2">
                          <Label>Custom row title</Label>
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="e.g. Vendor backup named"
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
                            Add to phase {meta.phase}
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
                          setAddWeek(meta.phase)
                          setNewTitle("")
                          setNewDesc("")
                          setAddError(null)
                        }}
                      >
                        <Plus className="size-3.5" aria-hidden />
                        Add row to this phase
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

function GuidedRoadmapTaskCard({
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
  const kind = task.item_kind ?? "operational_task"
  const { label, className, Icon } = kindPresentation(kind)

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
    if (!window.confirm("Remove this row from your roadmap?")) return
    startSave(async () => {
      const res = await deleteOwnerEscapePlanMilestone(task.id)
      if (res.ok) onRefresh()
    })
  }

  return (
    <li>
      <Card
        className={cn(
          "border shadow-none",
          kind === "risk_warning"
            ? "border-amber-500/25 bg-amber-500/[0.04]"
            : "border-border/50 bg-background/60"
        )}
      >
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
          <div className="flex shrink-0 items-start gap-3 pt-0.5">
            <Checkbox
              checked={complete}
              disabled={readOnly || pending || savePending}
              onCheckedChange={(v) => onToggle(task.id, v === true)}
              className="mt-1"
              aria-label={`Mark complete: ${task.title}`}
            />
            <Badge variant="outline" className={cn("gap-1 px-2 py-0.5 text-[0.65rem] font-semibold", className)}>
              <Icon className="size-3 shrink-0 opacity-80" aria-hidden />
              {label}
            </Badge>
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
                  aria-label="Remove row"
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
              placeholder="Operational detail"
            />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Personalize (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveIfChanged}
                disabled={readOnly || pending}
                rows={2}
                className="text-sm"
                placeholder="Names, dates, links to Standards / Training"
              />
            </div>
            {complete ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                Installed / verified
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Circle className="size-3.5 opacity-50" aria-hidden />
                Not yet verified
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </li>
  )
}
