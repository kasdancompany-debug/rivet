"use client"

import { Camera, FileText, Trash2 } from "lucide-react"

import {
  OPERATIONAL_MEDIA_ACCEPT_AUDIO,
  OPERATIONAL_MEDIA_ACCEPT_IMAGES,
  OPERATIONAL_MEDIA_ACCEPT_PDF,
  OPERATIONAL_MEDIA_ACCEPT_VIDEOS,
} from "@/lib/media/constants"
import type { OperationalUploadJob } from "@/lib/media/types"
import { isSlotUploading, uploadProgressForJobs } from "@/lib/media/upload-progress"
import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { OperationalMediaDropzone } from "@/components/media/operational-media-dropzone"
import { OperationalMediaGallery } from "@/components/media/operational-media-gallery"
import { OperationalMediaHub } from "@/components/media/operational-media-hub"
import { OperationalMediaPreview } from "@/components/media/operational-media-preview"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export type OperationalMemorySectionProps = {
  canUpload: boolean
  uploadJobs?: OperationalUploadJob[]
  onDismissUploadJob?: (jobId: string) => void
  walkthroughMedia?: StandardMediaRowSigned | null
  audioExplanationMedia?: StandardMediaRowSigned | null
  referencePhotos: StandardMediaRowSigned[]
  supportingDocuments: StandardMediaRowSigned[]
  onUploadWalkthrough: (file: File) => void | Promise<void>
  onUploadAudio: (file: File) => void | Promise<void>
  onUploadReferencePhotos: (files: File[]) => void | Promise<void>
  onUploadDocument: (file: File) => void | Promise<void>
  onRemoveWalkthrough?: () => void
  onRemoveAudio?: () => void
  onRemoveReferencePhoto?: (mediaId: string) => void
  onRemoveDocument?: (mediaId: string) => void
}

export function OperationalMemorySection({
  canUpload,
  uploadJobs = [],
  onDismissUploadJob,
  walkthroughMedia,
  audioExplanationMedia,
  referencePhotos,
  supportingDocuments,
  onUploadWalkthrough,
  onUploadAudio,
  onUploadReferencePhotos,
  onUploadDocument,
  onRemoveWalkthrough,
  onRemoveAudio,
  onRemoveReferencePhoto,
  onRemoveDocument,
}: OperationalMemorySectionProps) {
  const walkthroughPending = isSlotUploading(uploadJobs, "walkthrough")
  const audioPending = isSlotUploading(uploadJobs, "audio-explanation")
  const photosPending = isSlotUploading(uploadJobs, "reference-photo")
  const docsPending = isSlotUploading(uploadJobs, "supporting-document")

  return (
    <OperationalMediaHub jobs={uploadJobs} onDismissJob={onDismissUploadJob}>
      <Card className="overflow-hidden border-border/50 bg-card/90 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <OperationalMediaDropzone
            label="Demonstration video"
            description="Show the play running start to finish."
            accept={OPERATIONAL_MEDIA_ACCEPT_VIDEOS}
            media={walkthroughMedia}
            canUpload={canUpload}
            uploadPending={walkthroughPending}
            uploadProgress={uploadProgressForJobs(uploadJobs, { slot: "walkthrough" })}
            onUpload={onUploadWalkthrough}
            onRemove={onRemoveWalkthrough}
            uploadLabel="Upload video"
            replaceLabel="Replace video"
            previewAspect="video"
            captureMode="environment"
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/50 bg-card/90 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <OperationalMediaDropzone
            label="Audio explanation"
            description="Record why this play matters or how to handle edge cases."
            accept={OPERATIONAL_MEDIA_ACCEPT_AUDIO}
            media={audioExplanationMedia}
            canUpload={canUpload}
            uploadPending={audioPending}
            uploadProgress={uploadProgressForJobs(uploadJobs, { slot: "audio-explanation" })}
            onUpload={onUploadAudio}
            onRemove={onRemoveAudio}
            uploadLabel="Upload audio"
            replaceLabel="Replace audio"
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/50 bg-card/90 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Camera className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            Reference photos & screenshots
          </div>
          <OperationalMediaGallery
            items={referencePhotos}
            onRemove={onRemoveReferencePhoto}
            aspect="square"
          />
          <OperationalMediaDropzone
            label=""
            accept={OPERATIONAL_MEDIA_ACCEPT_IMAGES}
            canUpload={canUpload}
            uploadPending={photosPending}
            uploadProgress={uploadProgressForJobs(uploadJobs, { slot: "reference-photo" })}
            onUpload={(f) => onUploadReferencePhotos([f])}
            onUploadMany={onUploadReferencePhotos}
            multiple
            uploadLabel="Add photo or screenshot"
            replaceLabel="Add another"
            previewAspect="square"
            captureMode="environment"
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/50 bg-card/90 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            Supporting documents
          </div>
          {supportingDocuments.length > 0 ? (
            <ul className="space-y-2">
              {supportingDocuments.map((row) => (
                <li
                  key={row.id}
                  className="relative overflow-hidden rounded-xl ring-1 ring-border/50"
                >
                  <OperationalMediaPreview media={row} />
                  {onRemoveDocument ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute right-2 top-2 h-8 shadow-md"
                      onClick={() => onRemoveDocument(row.id)}
                    >
                      <Trash2 className="mr-1 size-3.5" aria-hidden />
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          <OperationalMediaDropzone
            label=""
            accept={OPERATIONAL_MEDIA_ACCEPT_PDF}
            canUpload={canUpload}
            uploadPending={docsPending}
            uploadProgress={uploadProgressForJobs(uploadJobs, { slot: "supporting-document" })}
            onUpload={onUploadDocument}
            uploadLabel="Upload PDF"
            replaceLabel="Add another PDF"
          />
        </CardContent>
      </Card>
    </OperationalMediaHub>
  )
}
