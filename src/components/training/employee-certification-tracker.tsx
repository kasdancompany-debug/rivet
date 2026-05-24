"use client"

import { Check, Circle } from "lucide-react"

import { signOffModuleCertification } from "@/app/actions/certifications"
import { COPY } from "@/lib/interface-copy"
import type { ModuleCertificationView } from "@/lib/training/certifications/build-views"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function StepDot({ done }: { done: boolean }) {
  return done ? (
    <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
  ) : (
    <Circle className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
  )
}

export function EmployeeCertificationTracker({
  certifications,
  businessId,
  employeeId,
  isOwner,
  pending,
  onAction,
}: {
  certifications: ModuleCertificationView[]
  businessId: string
  employeeId: string
  isOwner: boolean
  pending: boolean
  onAction: (fn: () => Promise<unknown>) => void
}) {
  if (certifications.length === 0) return null

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{COPY.certifications.trackerHeading}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{COPY.certifications.trackerHint}</p>
      </div>
      <ul className="space-y-3">
        {certifications.map((cert) => (
          <li
            key={cert.moduleId}
            className={cn(
              "rounded-xl border px-3 py-3",
              cert.certified
                ? "border-amber-500/30 bg-amber-500/[0.06]"
                : "border-border/50 bg-muted/15"
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{cert.moduleTitle}</p>
              {cert.certified ? (
                <span className="text-[0.62rem] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  {COPY.certifications.certifiedLabel}
                </span>
              ) : null}
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <StepDot done={cert.moduleCompleted} />
                {COPY.certifications.stepModule}
              </li>
              <li className="flex items-center gap-2">
                <StepDot done={cert.quizzesPassed} />
                {COPY.certifications.stepQuiz}
              </li>
              <li className="flex items-center gap-2">
                <StepDot done={cert.managerSignedOff} />
                {COPY.certifications.stepSignOff}
              </li>
            </ul>
            {isOwner && !cert.managerSignedOff ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-3 h-8"
                disabled={pending}
                onClick={() =>
                  onAction(() =>
                    signOffModuleCertification({
                      businessId,
                      employeeId,
                      moduleId: cert.moduleId,
                    })
                  )
                }
              >
                {COPY.certifications.signOffButton}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
