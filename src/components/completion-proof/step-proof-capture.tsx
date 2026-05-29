"use client"

import { useState, useTransition } from "react"
import { Camera, CheckCircle2, ClipboardCheck, Loader2, UserCheck, Video } from "lucide-react"

import {
  managerSignoffPortalStep,
  savePortalStepChecklist,
  savePortalStepPhoto,
  savePortalStepVideo,
} from "@/app/actions/training-portal"
import {
  prepareStandardMediaUpload,
  finalizeStandardMediaUpload,
} from "@/app/actions/standard-media"
import { getStepProofBlockers } from "@/lib/completion-proof/evaluate"
import { stepProofRequirementsFromRow } from "@/lib/completion-proof/requirements"
import type { StepProofState } from "@/lib/completion-proof/types"
import { uploadStandardMediaToSignedUrl } from "@/lib/standards/upload-standard-media-client"
import { COPY } from "@/lib/interface-copy"
import type { Tables } from "@/types/database"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type StepProofCaptureProps = {
  moduleId: string
  trainingItemId: string
  standardId: string
  businessId: string
  steps: Tables<"standard_steps">[]
  checklistStepIds: string[]
  stepProofByStepId: Record<string, StepProofState>
  completed: boolean
  /** When set, owner can sign off steps for this employee */
  managerSignoffEmployeeId?: string | null
  /** Owner review: show proof status and sign-off only (no staff uploads) */
  signoffOnlyMode?: boolean
  onRefresh: () => void
}

export function StepProofCapture({
  moduleId,
  trainingItemId,
  standardId,
  businessId,
  steps,
  checklistStepIds,
  stepProofByStepId,
  completed,
  managerSignoffEmployeeId = null,
  signoffOnlyMode = false,
  onRefresh,
}: StepProofCaptureProps) {
  const staffCanEdit = !signoffOnlyMode && !completed
  const [pending, startTransition] = useTransition()
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const p = COPY.completionProof

  function run<T>(fn: () => Promise<T>) {
    startTransition(async () => {
      await fn()
      onRefresh()
    })
  }

  async function uploadMedia(stepId: string, file: File, kind: "photo" | "video") {
    setUploadError(null)
    setUploadingStepId(stepId)
    try {
      const prep = await prepareStandardMediaUpload({
        businessId,
        standardId,
        fileName: file.name,
        contentType: file.type,
        byteSize: file.size,
      })
      if (!prep.ok) {
        setUploadError(prep.message ?? p.uploadFailed)
        return
      }
      await uploadStandardMediaToSignedUrl(prep.signedUrl, file, () => {})
      const fin = await finalizeStandardMediaUpload({
        businessId,
        standardId,
        storagePath: prep.path,
        contentType: file.type,
        byteSize: file.size,
      })
      if (!fin.ok) {
        setUploadError(fin.message ?? p.uploadFailed)
        return
      }
      const save = kind === "photo" ? savePortalStepPhoto : savePortalStepVideo
      const saved = await save({
        moduleId,
        trainingItemId,
        stepId,
        mediaId: fin.row.id,
        signedUrl: fin.row.signedUrl,
      })
      if (saved && typeof saved === "object" && "ok" in saved && saved.ok === false) {
        setUploadError("message" in saved ? String(saved.message) : p.uploadFailed)
      }
    } catch {
      setUploadError(p.uploadFailed)
    } finally {
      setUploadingStepId(null)
    }
  }

  if (steps.length === 0) return null

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {signoffOnlyMode ? "Manager sign-off" : "Play checklist & completion proof"}
      </h3>
      {uploadError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {uploadError}
        </p>
      ) : null}
      {completed && !signoffOnlyMode ? (
        <p className="text-xs text-muted-foreground">{p.proofsLocked}</p>
      ) : null}
      <ul className="space-y-2">
        {steps.map((step) => {
          const requirements = stepProofRequirementsFromRow(step)
          const checklistDone = checklistStepIds.includes(step.id)
          const proofState = stepProofByStepId[step.id]
          const blockers = getStepProofBlockers(requirements, proofState, checklistDone)
          const complete = blockers.length === 0

          return (
            <li
              key={step.id}
              className={cn(
                "rounded-xl border px-3 py-3",
                step.is_critical ? "border-amber-500/30 bg-amber-500/[0.04]" : "border-border/50 bg-muted/15",
                complete && "border-emerald-500/25 bg-emerald-500/[0.04]"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  {step.instructions ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.instructions}</p>
                  ) : null}
                </div>
                {complete ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" aria-hidden />
                    {p.allProofComplete}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {requirements.checklist ? (
                  <ProofBadge icon={ClipboardCheck} label={p.proofChecklist} done={checklistDone} />
                ) : null}
                {requirements.photo ? (
                  <ProofBadge icon={Camera} label={p.proofPhoto} done={Boolean(proofState?.photo?.mediaId)} />
                ) : null}
                {requirements.video ? (
                  <ProofBadge icon={Video} label={p.proofVideo} done={Boolean(proofState?.video?.mediaId)} />
                ) : null}
                {requirements.manager_signoff ? (
                  <ProofBadge
                    icon={UserCheck}
                    label={p.proofSignoff}
                    done={Boolean(proofState?.managerSignoff?.signedOffBy)}
                  />
                ) : null}
              </div>

              {requirements.checklist && !signoffOnlyMode ? (
                <label className="mt-3 flex cursor-pointer items-start gap-3 border-t border-border/40 pt-3">
                  <Checkbox
                    checked={checklistDone}
                    disabled={pending || !staffCanEdit}
                    className="mt-0.5"
                    onCheckedChange={(v) => {
                      const next = v === true
                      const ids = next
                        ? [...checklistStepIds, step.id]
                        : checklistStepIds.filter((id) => id !== step.id)
                      run(() =>
                        savePortalStepChecklist({
                          moduleId,
                          trainingItemId,
                          stepIds: ids,
                        })
                      )
                    }}
                  />
                  <span className="text-sm text-foreground">{p.proofChecklist}</span>
                </label>
              ) : null}

              {requirements.photo && !signoffOnlyMode ? (
                <ProofUploadBlock
                  kind="photo"
                  label={p.uploadPhoto}
                  accept="image/*"
                  capture="environment"
                  previewUrl={proofState?.photo?.signedUrl}
                  pending={pending}
                  uploading={uploadingStepId === step.id}
                  disabled={!staffCanEdit}
                  onFile={(file) => run(() => uploadMedia(step.id, file, "photo"))}
                />
              ) : null}

              {requirements.video && !signoffOnlyMode ? (
                <ProofUploadBlock
                  kind="video"
                  label={p.uploadVideo}
                  accept="video/*"
                  previewUrl={proofState?.video?.signedUrl}
                  pending={pending}
                  uploading={uploadingStepId === step.id}
                  disabled={!staffCanEdit}
                  onFile={(file) => run(() => uploadMedia(step.id, file, "video"))}
                />
              ) : null}

              {requirements.manager_signoff ? (
                <div className="mt-3 border-t border-border/40 pt-3">
                  {proofState?.managerSignoff ? (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      {p.signoffDone}
                      {proofState.managerSignoff.signedOffName
                        ? ` · ${proofState.managerSignoff.signedOffName}`
                        : ""}
                    </p>
                  ) : managerSignoffEmployeeId ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        run(() =>
                          managerSignoffPortalStep({
                            moduleId,
                            trainingItemId,
                            stepId: step.id,
                            employeeId: managerSignoffEmployeeId,
                          })
                        )
                      }
                    >
                      {p.signoffStep}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {p.awaitingSignoff} {p.signoffStaffHint}
                    </p>
                  )}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ProofBadge({
  icon: Icon,
  label,
  done,
}: {
  icon: typeof Camera
  label: string
  done: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
        done
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
          : "border-border/60 bg-muted/30 text-muted-foreground"
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  )
}

function ProofUploadBlock({
  label,
  accept,
  capture,
  previewUrl,
  pending,
  uploading,
  disabled,
  onFile,
}: {
  kind: "photo" | "video"
  label: string
  accept: string
  capture?: "environment"
  previewUrl?: string | null
  pending: boolean
  uploading: boolean
  disabled: boolean
  onFile: (file: File) => void
}) {
  return (
    <div className="mt-3 border-t border-border/40 pt-3">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {previewUrl && accept.startsWith("image") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className="mt-2 max-h-40 w-full rounded-lg object-cover" />
      ) : null}
      {previewUrl && accept.startsWith("video") ? (
        <video src={previewUrl} controls className="mt-2 max-h-48 w-full rounded-lg" />
      ) : null}
      <div className="mt-2 flex items-center gap-2">
        <input
          type="file"
          accept={accept}
          capture={capture}
          className="block w-full text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:text-primary-foreground"
          disabled={pending || uploading || disabled}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
          }}
        />
        {uploading ? <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden /> : null}
      </div>
    </div>
  )
}
