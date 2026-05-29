"use client"

import { useCallback, useState } from "react"

import {
  abandonStandardMediaUpload,
  deleteStandardMedia,
  finalizeStandardMediaUpload,
  prepareStandardMediaUpload,
} from "@/app/actions/standard-media"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { validateStandardMediaUpload } from "@/lib/standards/standard-media-validation"
import { uploadStandardMediaToSignedUrl } from "@/lib/media/upload-client"

import type {
  OperationalMediaSlotValidator,
  OperationalMediaUploadResult,
  OperationalUploadJob,
} from "./types"

export function useOperationalMediaUpload(params: {
  businessId: string
  standardId: string | null
  onError?: (message: string) => void
  onRequireDraft?: () => void
}) {
  const { businessId, standardId, onError, onRequireDraft } = params
  const [jobs, setJobs] = useState<OperationalUploadJob[]>([])

  const uploadInFlight = jobs.some(
    (j) => j.phase === "preparing" || j.phase === "uploading" || j.phase === "finalizing"
  )

  const upload = useCallback(
    async (
      file: File,
      options?: {
        slot?: string
        validateSlot?: OperationalMediaSlotValidator
        replaceMediaId?: string | null
        onSuccess?: (result: OperationalMediaUploadResult) => void
      }
    ): Promise<OperationalMediaUploadResult | null> => {
      const stdId = standardId
      if (!stdId) {
        onRequireDraft?.()
        onError?.("Save a draft first—then you can attach photos, video, audio, and PDFs.")
        return null
      }

      const validated = validateStandardMediaUpload({
        contentType: file.type || "application/octet-stream",
        byteSize: file.size,
      })
      if (!validated.ok) {
        onError?.(validated.message)
        return null
      }

      const slotError = options?.validateSlot?.({
        contentType: file.type,
        byteSize: file.size,
        kind: validated.kind,
      })
      if (slotError) {
        onError?.(slotError)
        return null
      }

      const jobId = crypto.randomUUID()
      setJobs((j) => [
        ...j,
        {
          id: jobId,
          fileName: file.name,
          progress: 0,
          phase: "preparing",
          slot: options?.slot,
        },
      ])

      let pathUsed: string | null = null

      const run = async (): Promise<OperationalMediaUploadResult | null> => {
        try {
          if (options?.replaceMediaId) {
            const del = await deleteStandardMedia({
              businessId,
              standardId: stdId,
              mediaId: options.replaceMediaId,
            })
            if (!del.ok) throw new Error(del.message)
          }

          const prep = await prepareStandardMediaUpload({
            businessId,
            standardId: stdId,
            fileName: file.name,
            contentType: file.type || "application/octet-stream",
            byteSize: file.size,
          })
          if (!prep.ok) throw new Error(prep.message)
          pathUsed = prep.path

          setJobs((j) =>
            j.map((x) => (x.id === jobId ? { ...x, phase: "uploading" as const } : x))
          )

          await uploadStandardMediaToSignedUrl(prep.signedUrl, file, (pct) => {
            setJobs((j) =>
              j.map((x) => (x.id === jobId ? { ...x, progress: pct } : x))
            )
          })

          setJobs((j) =>
            j.map((x) => (x.id === jobId ? { ...x, phase: "finalizing" as const } : x))
          )

          const fin = await finalizeStandardMediaUpload({
            businessId,
            standardId: stdId,
            storagePath: prep.path,
            contentType: file.type || "application/octet-stream",
            byteSize: file.size,
          })
          if (!fin.ok) {
            await abandonStandardMediaUpload({
              businessId,
              standardId: stdId,
              storagePath: prep.path,
            })
            throw new Error(fin.message)
          }

          setJobs((j) => j.filter((x) => x.id !== jobId))
          const result = { row: fin.row }
          options?.onSuccess?.(result)
          return result
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Upload failed."
          onError?.(msg)
          if (pathUsed) {
            await abandonStandardMediaUpload({
              businessId,
              standardId: stdId,
              storagePath: pathUsed,
            })
          }
          setJobs((j) =>
            j.map((x) =>
              x.id === jobId
                ? {
                    ...x,
                    phase: "error" as const,
                    errorMessage: msg,
                    retry: () => {
                      setJobs((inner) => inner.filter((z) => z.id !== jobId))
                      void run()
                    },
                  }
                : x
            )
          )
          return null
        }
      }

      return run()
    },
    [businessId, onError, onRequireDraft, standardId]
  )

  const dismissJob = useCallback((jobId: string) => {
    setJobs((j) => j.filter((x) => x.id !== jobId))
  }, [])

  return { jobs, uploadInFlight, upload, dismissJob }
}
