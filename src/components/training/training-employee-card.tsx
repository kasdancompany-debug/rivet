"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { BookOpen, ChevronDown, UserRound } from "lucide-react"

import {
  assignTrainingModule,
  setReadinessOverride,
  toggleTrainingSopCompletion,
  unassignTrainingModule,
} from "@/app/actions/training"
import { COPY } from "@/lib/interface-copy"
import type { EmployeeTrainingViewModel } from "@/lib/training/build-views"
import { formatTrainingRole } from "@/lib/training/roles"
import type { ReadinessCapabilityField, DelegationReadinessStatus } from "@/lib/training/compute-readiness"
import {
  buildTrainingCenterStaffSummary,
  capabilityLineClass,
} from "@/lib/training/training-center-summary"
import { EmployeeObservationTimeline } from "@/components/training/employee-observation-timeline"
import { EmployeeReadinessPanel } from "@/components/training/employee-readiness-panel"
import { EmployeeCertificationBadges } from "@/components/training/employee-certification-badges"
import { EmployeeCertificationTracker } from "@/components/training/employee-certification-tracker"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type ModuleOption = { id: string; title: string }

export function TrainingEmployeeCard({
  vm,
  businessId,
  currentUserId,
  canManageTeam,
  canSignOff,
  moduleOptions,
}: {
  vm: EmployeeTrainingViewModel
  businessId: string
  currentUserId: string
  canManageTeam: boolean
  canSignOff: boolean
  moduleOptions: ModuleOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [banner, setBanner] = useState<string | null>(null)
  const [assignModuleId, setAssignModuleId] = useState("")
  const [detailsOpen, setDetailsOpen] = useState(false)

  const summary = useMemo(
    () =>
      buildTrainingCenterStaffSummary({
        readiness: vm.readiness,
        modules: vm.modules,
        certifications: vm.certifications,
      }),
    [vm.readiness, vm.modules, vm.certifications]
  )

  const canEditSops = canManageTeam || vm.profile.id === currentUserId
  const assignedIds = new Set(vm.modules.map((m) => m.moduleId))
  const assignChoices = moduleOptions.filter((m) => !assignedIds.has(m.id))

  function run<T>(fn: () => Promise<T>) {
    setBanner(null)
    startTransition(async () => {
      const res = await fn()
      if (res && typeof res === "object" && "ok" in res && res.ok === false) {
        setBanner("message" in res ? String((res as { message: string }).message) : "Action failed.")
        return
      }
      router.refresh()
    })
  }

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/40">
              <UserRound className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <CardTitle className="text-lg">{vm.profile.full_name}</CardTitle>
              <CardDescription className="mt-0.5">
                {vm.profile.role?.trim() || "Staff member"}
                {vm.profile.is_owner ? " · Owner" : null}
              </CardDescription>
              {vm.certifiedBadges.length > 0 ? (
                <div className="mt-3">
                  <EmployeeCertificationBadges
                    badges={vm.certifiedBadges}
                    hrefForModule={(moduleId) =>
                      `/training/certificates/${vm.profile.id}/${moduleId}`
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {COPY.training.employeeCardReadiness}
              </p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {summary.trainingScore}%
              </p>
            </div>
            <div>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {COPY.training.employeeQuizScore}
              </p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {summary.quizScore}%
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {banner ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {banner}
          </p>
        ) : null}

        <section aria-label="Skill readiness">
          <ul className="space-y-2">
            {summary.capabilityLines.map((line) => (
              <li
                key={line.field}
                className="flex items-baseline justify-between gap-3 rounded-lg border border-border/40 bg-muted/10 px-3 py-2"
              >
                <span className="text-sm font-medium text-foreground">{line.label}</span>
                <span className={cn("text-sm font-medium text-right", capabilityLineClass(line.tone))}>
                  {line.display}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {(summary.readySkills.length > 0 || summary.needsWorkSkills.length > 0) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {summary.readySkills.length > 0 ? (
              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.05] px-3 py-2.5">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-200">
                  {COPY.training.employeeSkillsReady}
                </p>
                <p className="mt-1 text-sm text-foreground">{summary.readySkills.join(", ")}</p>
              </div>
            ) : null}
            {summary.needsWorkSkills.length > 0 ? (
              <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.05] px-3 py-2.5">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-amber-900 dark:text-amber-100">
                  {COPY.training.employeeSkillsNeedsWork}
                </p>
                <p className="mt-1 text-sm text-foreground">{summary.needsWorkSkills.join(", ")}</p>
              </div>
            ) : null}
          </div>
        )}

        <section>
          <h3 className="text-sm font-semibold text-foreground">{COPY.training.employeeAssignedModules}</h3>
          {vm.modules.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{COPY.training.employeeNoModules}</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {vm.modules.map((mod) => (
                <li
                  key={mod.moduleId}
                  className="rounded-lg border border-border/50 bg-muted/15 px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{mod.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTrainingRole(mod.assignedRole)} · {mod.requiredDone}/{mod.requiredTotal} plays ·{" "}
                        {mod.status.replace(/_/g, " ")}
                      </p>
                    </div>
                    {mod.pct !== null ? (
                      <span className="text-sm font-semibold tabular-nums">{mod.pct}%</span>
                    ) : null}
                  </div>
                  {mod.pct !== null ? (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width]"
                        style={{ width: `${mod.pct}%` }}
                      />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold text-foreground">{COPY.training.employeeManagerSignOffs}</h3>
          {summary.pendingSignOffs.length === 0 && summary.completedSignOffs.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">{COPY.training.employeeNoSignOffs}</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {summary.pendingSignOffs.map((s) => (
                <li key={s.moduleId} className="flex items-center gap-2 text-sky-800 dark:text-sky-200">
                  <Badge variant="outline" className="text-[0.62rem]">
                    {COPY.training.employeeSignOffPending}
                  </Badge>
                  {s.moduleTitle}
                </li>
              ))}
              {summary.completedSignOffs.map((s) => (
                <li key={s.moduleId} className="flex items-center gap-2 text-muted-foreground">
                  <Badge variant="outline" className="border-emerald-500/30 text-[0.62rem] text-emerald-800">
                    {COPY.training.employeeSignOffComplete}
                  </Badge>
                  {s.moduleTitle}
                </li>
              ))}
            </ul>
          )}
        </section>

        <EmployeeCertificationTracker
          certifications={vm.certifications}
          businessId={businessId}
          employeeId={vm.profile.id}
          canSignOff={canSignOff}
          pending={pending}
          onAction={run}
        />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 w-full justify-between text-muted-foreground"
          onClick={() => setDetailsOpen((o) => !o)}
        >
          {detailsOpen ? COPY.training.employeeCollapseDetails : COPY.training.employeeExpandDetails}
          <ChevronDown className={cn("size-4 transition-transform", detailsOpen && "rotate-180")} />
        </Button>

        {detailsOpen ? (
          <div className="space-y-6 border-t border-border/40 pt-5">
            <section aria-labelledby={`readiness-${vm.profile.id}`}>
              <h3 id={`readiness-${vm.profile.id}`} className="text-sm font-semibold text-foreground">
                {COPY.training.employeeDelegationHeading}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">{COPY.training.employeeDelegationHint}</p>
              <div className="mt-4">
                <EmployeeReadinessPanel
                  readiness={vm.readiness}
                  canManageTeam={canManageTeam}
                  pending={pending}
                  onOverride={(field: ReadinessCapabilityField, value: DelegationReadinessStatus | null) => {
                    run(() =>
                      setReadinessOverride({
                        businessId,
                        employeeId: vm.profile.id,
                        field,
                        value,
                      })
                    )
                  }}
                />
              </div>
            </section>

            <Separator />

            <EmployeeObservationTimeline
              observations={vm.observations}
              businessId={businessId}
              employeeId={vm.profile.id}
              canManageTeam={canManageTeam}
              pending={pending}
              onAction={run}
            />

            <Separator />

            <section>
              <h3 className="text-sm font-semibold text-foreground">{COPY.training.employeeModulesHeading}</h3>
              {vm.modules.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">{COPY.training.employeeNoModules}</p>
              ) : (
                <ul className="mt-3 space-y-5">
                  {vm.modules.map((mod) => (
                    <li
                      key={mod.moduleId}
                      className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{mod.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTrainingRole(mod.assignedRole)} · {mod.status.replace(/_/g, " ")}
                          </p>
                        </div>
                        {canManageTeam ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={pending}
                            onClick={() => {
                              if (!window.confirm(COPY.training.employeeRemoveConfirm(mod.title))) return
                              run(() =>
                                unassignTrainingModule({
                                  progressId: mod.progressId,
                                  employeeId: vm.profile.id,
                                  moduleId: mod.moduleId,
                                })
                              )
                            }}
                          >
                            {COPY.training.employeeRemove}
                          </Button>
                        ) : null}
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div>
                          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                            {COPY.training.employeeDonePlays(mod.completedSopTitles.length)}
                          </p>
                          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                            {mod.completedSopTitles.length === 0 ? (
                              <li>—</li>
                            ) : (
                              mod.completedSopTitles.map((t) => <li key={t}>{t}</li>)
                            )}
                          </ul>
                        </div>
                        <div>
                          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                            {COPY.training.employeeRemainingPlays(mod.remainingSopTitles.length)}
                          </p>
                          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                            {mod.remainingSopTitles.length === 0 ? (
                              <li>—</li>
                            ) : (
                              mod.remainingSopTitles.map((t) => <li key={t}>{t}</li>)
                            )}
                          </ul>
                        </div>
                      </div>
                      {mod.sopRows.length > 0 ? (
                        <ul className="mt-4 space-y-2 border-t border-border/40 pt-3">
                          {mod.sopRows.map((row) => (
                            <li key={row.trainingItemId}>
                              <label className="flex cursor-pointer items-start gap-3">
                                <Checkbox
                                  checked={row.completed}
                                  disabled={pending || !canEditSops}
                                  onCheckedChange={(v) => {
                                    const next = v === true
                                    if (next === row.completed) return
                                    run(() =>
                                      toggleTrainingSopCompletion({
                                        employeeId: vm.profile.id,
                                        trainingItemId: row.trainingItemId,
                                        moduleId: row.moduleId,
                                        complete: next,
                                      })
                                    )
                                  }}
                                  className="mt-0.5"
                                />
                                <span className="text-sm leading-snug">{row.title}</span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              {canManageTeam && assignChoices.length > 0 ? (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1 space-y-1">
                    <Label htmlFor={`assign-${vm.profile.id}`}>{COPY.training.employeeAddModule}</Label>
                    <select
                      id={`assign-${vm.profile.id}`}
                      value={assignModuleId}
                      onChange={(e) => setAssignModuleId(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                    >
                      <option value="">{COPY.training.employeeChooseModule}</option>
                      {assignChoices.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    type="button"
                    disabled={pending || !assignModuleId}
                    onClick={() => {
                      const id = assignModuleId
                      if (!id) return
                      run(async () => {
                        const res = await assignTrainingModule({
                          employeeId: vm.profile.id,
                          trainingModuleId: id,
                        })
                        if (res.ok) setAssignModuleId("")
                        return res
                      })
                    }}
                  >
                    {COPY.training.employeeAssign}
                  </Button>
                </div>
              ) : null}
            </section>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BookOpen className="size-3.5 shrink-0" aria-hidden />
              <span>{COPY.training.employeeSopFootnote}</span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
