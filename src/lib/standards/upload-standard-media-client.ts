/**
 * Browser upload to Supabase signed upload URL with progress (matches storage-js FormData shape).
 */
export function uploadStandardMediaToSignedUrl(
  signedUrl: string,
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", signedUrl)

    if (signal) {
      const onAbort = () => {
        xhr.abort()
        reject(new Error("Upload cancelled."))
      }
      if (signal.aborted) {
        onAbort()
        return
      }
      signal.addEventListener("abort", onAbort, { once: true })
      xhr.addEventListener("loadend", () => {
        signal.removeEventListener("abort", onAbort)
      })
    }

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress(Math.min(100, Math.round((ev.loaded / ev.total) * 100)))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100)
        resolve()
        return
      }
      let detail = `Upload failed (HTTP ${xhr.status}).`
      try {
        const j = JSON.parse(xhr.responseText) as { message?: string; error?: string }
        if (typeof j.message === "string" && j.message.trim()) detail = j.message.trim()
        else if (typeof j.error === "string" && j.error.trim()) detail = j.error.trim()
      } catch {
        if (xhr.responseText?.trim()) detail = xhr.responseText.trim().slice(0, 280)
      }
      reject(new Error(detail))
    }

    xhr.onerror = () => {
      reject(new Error("Network error during upload. Check your connection and try again."))
    }

    xhr.ontimeout = () => {
      reject(new Error("Upload timed out. Try again with a smaller file or a faster connection."))
    }

    const body = new FormData()
    body.append("cacheControl", "3600")
    body.append("", file)
    xhr.send(body)
  })
}
