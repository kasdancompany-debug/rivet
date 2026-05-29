import type { OperationalMediaSlotValidator } from "@/lib/media/types"

export type MediaUploadSlot =
  | "reference-photo"
  | "walkthrough"
  | "audio-explanation"
  | "supporting-document"
  | "good-example"
  | "bad-example"
  | "step-good-example"
  | "step-bad-example"

export function validatorForMediaSlot(slot: MediaUploadSlot): OperationalMediaSlotValidator {
  return ({ kind, contentType }) => {
    if (slot === "walkthrough" && kind !== "video") {
      return "Demonstration videos must be MP4, MOV, or WebM."
    }
    if (slot === "reference-photo" && kind !== "image") {
      return "Reference uploads must be a photo or screenshot (JPG, PNG, WebP, or GIF)."
    }
    if (
      (slot === "good-example" ||
        slot === "bad-example" ||
        slot === "step-good-example" ||
        slot === "step-bad-example") &&
      kind !== "image" &&
      kind !== "video"
    ) {
      return "Examples must be a photo or video."
    }
    if (slot === "audio-explanation") {
      if (kind !== "file" || !contentType.startsWith("audio/")) {
        return "Audio explanation must be MP3, WAV, OGG, or WebM audio."
      }
    }
    if (slot === "supporting-document") {
      if (kind !== "file" || contentType !== "application/pdf") {
        return "Supporting documents must be PDF."
      }
    }
    return null
  }
}
