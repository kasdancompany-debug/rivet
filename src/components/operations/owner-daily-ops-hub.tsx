import { AlertCircle, Camera, CheckCircle2, Circle, MessageSquare } from "lucide-react"

import { hasPhotoConfirmed, isPhotoPending } from "@/lib/daily-ops/photos"
import type { ShiftSnapshot } from "@/lib/daily-ops/shift-snapshot"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

function formatTime(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })
}

function ShiftOwnerCard({
  snapshot,
  nameById,
}: {
  snapshot: ShiftSnapshot | null
  nameById: Record<string, string>
}) {
  if (!snapshot) {
    return (
      <Card className="border-border/60 bg-card/60">
        <CardHeader>
          <CardTitle className="text-base">Checklist</CardTitle>
          <CardDescription>No checklist template yet.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const { checklist, run, items, issues } = snapshot
  const rows = [...checklist.daily_checklist_items]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((line) => {
      const item = items.find((i) => i.checklist_item_id === line.id) ?? null
      return { line, item }
    })
  const total = rows.length
  const done = rows.filter((r) => r.item?.completed).length
  const pct = total ? Math.round((done / total) * 100) : 0
  const incompleteRows = rows.filter((r) => !r.item?.completed)
  const completedRows = rows.filter((r) => r.item?.completed)
  const starterName = run ? nameById[run.employee_id] ?? "Team member" : "—"

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm">
      <CardHeader className="space-y-1 border-b border-border/50 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">{checklist.title}</CardTitle>
          {run ? (
            <Badge
              variant="outline"
              className={cn(
                run.status === "completed" &&
                  "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-900 dark:text-emerald-300/90",
                run.status === "in_progress" &&
                  "border-amber-500/30 bg-amber-500/[0.06] text-amber-950 dark:text-amber-300/90"
              )}
            >
              {run.status === "completed" ? "Completed" : "In progress"}
            </Badge>
          ) : (
            <Badge variant="outline">Not started</Badge>
          )}
        </div>
        <CardDescription>
          Started by <span className="font-medium text-foreground">{starterName}</span>
          {run ? (
            <>
              {" "}
              · {formatTime(run.started_at)}
              {run.completed_at ? (
                <>
                  {" "}
                  · Done {formatTime(run.completed_at)}
                </>
              ) : null}
            </>
          ) : null}
        </CardDescription>
        <div className="pt-2">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Checklist</span>
            <span>
              {done}/{total} ({pct}%)
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-5 text-sm">
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Circle className="size-3.5" aria-hidden />
            Incomplete
          </h3>
          {incompleteRows.length === 0 ? (
            <p className="text-muted-foreground">Everything checked off.</p>
          ) : (
            <ul className="space-y-1.5">
              {incompleteRows.map(({ line }) => (
                <li key={line.id} className="flex gap-2 text-foreground/90">
                  <span className="text-muted-foreground">·</span>
                  <span>{line.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <CheckCircle2 className="size-3.5" aria-hidden />
            Who checked what
          </h3>
          {completedRows.length === 0 ? (
            <p className="text-muted-foreground">No completed rows yet.</p>
          ) : (
            <ul className="space-y-2">
              {completedRows.map(({ line, item }) => (
                <li
                  key={line.id}
                  className="flex flex-col gap-0.5 rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                >
                  <span className="font-medium leading-snug">{line.text}</span>
                  <span className="text-xs text-muted-foreground">
                    {item?.completed_by
                      ? nameById[item.completed_by] ?? "Team member"
                      : "Unknown"}{" "}
                    · {formatTime(item?.completed_at ?? null)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <MessageSquare className="size-3.5" aria-hidden />
            Notes
          </h3>
          {run?.notes?.trim() ? (
            <p className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 whitespace-pre-wrap">
              <span className="text-xs font-medium text-muted-foreground">Shift · </span>
              {run.notes.trim()}
            </p>
          ) : (
            <p className="text-muted-foreground">No shift notes.</p>
          )}
          {rows.some((r) => r.item?.note?.trim()) ? (
            <ul className="mt-3 space-y-2">
              {rows
                .filter((r) => r.item?.note?.trim())
                .map(({ line, item }) => (
                  <li key={line.id} className="rounded-lg border border-border/50 px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground">{line.text}</p>
                    <p className="mt-1 whitespace-pre-wrap text-foreground/90">{item?.note}</p>
                  </li>
                ))}
            </ul>
          ) : null}
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Camera className="size-3.5" aria-hidden />
            Photos
          </h3>
          {rows.some((r) => r.line.required_photo || r.item?.photo_url) ? (
            <ul className="space-y-2">
              {rows
                .filter((r) => r.line.required_photo || r.item?.photo_url)
                .map(({ line, item }) => {
                  const url = item?.photo_url ?? null
                  const pending = isPhotoPending(url)
                  const ok = hasPhotoConfirmed(url)
                  return (
                    <li
                      key={line.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2 text-xs"
                    >
                      <span className="font-medium text-foreground/90">{line.text}</span>
                      {ok ? (
                        <Badge variant="outline" className="text-[0.65rem]">
                          Photo on file
                        </Badge>
                      ) : pending ? (
                        <Badge variant="outline" className="text-[0.65rem]">
                          Photo pending
                        </Badge>
                      ) : line.required_photo ? (
                        <span className="text-muted-foreground">Awaiting photo</span>
                      ) : null}
                    </li>
                  )
                })}
            </ul>
          ) : (
            <p className="text-muted-foreground">No photo steps on this list.</p>
          )}
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <AlertCircle className="size-3.5" aria-hidden />
            Bottlenecks from this shift
          </h3>
          {issues.length === 0 ? (
            <p className="text-muted-foreground">None linked to this run.</p>
          ) : (
            <ul className="space-y-2">
              {issues.map((issue) => (
                <li key={issue.id} className="rounded-lg border border-border/50 px-3 py-2">
                  <p className="font-medium">{issue.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {issue.status} · {formatTime(issue.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  )
}

export function OwnerDailyOpsHub({
  shiftDate,
  opening,
  closing,
  nameById,
}: {
  shiftDate: string
  opening: ShiftSnapshot | null
  closing: ShiftSnapshot | null
  nameById: Record<string, string>
}) {
  const pretty = new Date(`${shiftDate}T12:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  })

  return (
    <section className="space-y-4" aria-labelledby="owner-ops-heading">
      <div>
        <h2 id="owner-ops-heading" className="text-xl font-semibold tracking-tight">
          Today on the floor
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{pretty}</p>
      </div>
      <Separator />
      <div className="grid gap-6 lg:grid-cols-2">
        <ShiftOwnerCard snapshot={opening} nameById={nameById} />
        <ShiftOwnerCard snapshot={closing} nameById={nameById} />
      </div>
    </section>
  )
}
