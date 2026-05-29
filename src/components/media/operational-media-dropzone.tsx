"use client"

import { useRef, useState } from "react"
import { FileUp, Loader2, Smartphone, Upload } from "lucide-react"

import type { StandardMediaRowSigned } from "@/lib/standards/standard-media-types"
import { OperationalMediaPreview } from "@/components/media/operational-media-preview"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type OperationalMediaDropzoneProps = {
  label: string
  description?: string
  accept: string
  media?: StandardMediaRowSigned | null
  canUpload: boolean
  uploadPending?: boolean
  uploadProgress?: number | null
  disabled?: boolean
  onUpload: (file: File) => void | Promise<void>
  onUploadMany?: (files: File[]) => void | Promise<void>
  onRemove?: () => void
  replaceLabel?: string
  uploadLabel?: string
  previewAspect?: "video" | "square" | "auto"
  /** Prefer camera on mobile (photos / short video). */
  captureMode?: "environment" | "user" | boolean
  multiple?: boolean
  className?: string
}

export function OperationalMediaDropzone({
  label,
  description,
  accept,
  media,
  canUpload,
  uploadPending,
  uploadProgress,
  disabled,
  onUpload,
  onUploadMany,
  onRemove,
  replaceLabel = "Replace",
  uploadLabel = "Upload",
  previewAspect = "auto",
  captureMode,
  multiple = false,
  className,
}: OperationalMediaDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const blocked = disabled || !canUpload || uploadPending

  function pickFiles(fileList: FileList | null | undefined) {
    if (!fileList?.length || blocked) return
    const files = [...fileList]
    if (multiple && onUploadMany) {
      void onUploadMany(files)
    } else {
      const file = files[0]
      if (file) void onUpload(file)
    }
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <div>
          <p className="text-sm font-medium tracking-tight text-foreground">{label}</p>
          {description ? <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}

      {media ? (
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-muted/10 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
          <OperationalMediaPreview media={media} aspect={previewAspect} className="w-full" />
          {onRemove ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute right-2 top-2 h-8 shadow-md backdrop-blur-sm"
              onClick={onRemove}
            >
              Remove
            </Button>
          ) : null}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={blocked ? -1 : 0}
          onKeyDown={(e) => {
            if (blocked) return
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (!blocked) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            pickFiles(e.dataTransfer.files)
          }}
          onClick={() => {
            if (!blocked) inputRef.current?.click()
          }}
          className={cn(
            "group flex min-h-[8.5rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-7 text-center transition-all duration-200",
            dragOver
              ? "border-primary/45 bg-primary/[0.05] shadow-inner"
              : "border-border/60 bg-gradient-to-b from-muted/20 to-muted/5 hover:border-border hover:from-muted/30 hover:to-muted/10",
            blocked && "cursor-not-allowed opacity-55"
          )}
        >
          {uploadPending ? (
            <Loader2 className="size-7 animate-spin text-primary/80" aria-hidden />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-2xl bg-background/80 shadow-sm ring-1 ring-border/50 transition-transform group-hover:scale-[1.02]">
              <Upload className="size-5 text-muted-foreground" aria-hidden />
            </span>
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">{uploadLabel}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drag and drop · click to browse
              {captureMode ? (
                <span className="mt-0.5 flex items-center justify-center gap-1">
                  <Smartphone className="size-3" aria-hidden />
                  Camera on phone
                </span>
              ) : null}
            </p>
          </div>
          {uploadProgress != null && uploadPending ? (
            <div className="h-1 w-full max-w-[12rem] overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          ) : null}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        capture={captureMode === true ? "environment" : captureMode || undefined}
        className="hidden"
        disabled={blocked}
        onChange={(e) => pickFiles(e.target.files)}
      />

      {media ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-full"
          disabled={blocked}
          onClick={() => inputRef.current?.click()}
        >
          {uploadPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <FileUp className="size-3.5" aria-hidden />
          )}
          {replaceLabel}
        </Button>
      ) : null}

      {!canUpload ? (
        <p className="text-xs text-muted-foreground">Save a draft once to attach operational memory here.</p>
      ) : null}
    </div>
  )
}
