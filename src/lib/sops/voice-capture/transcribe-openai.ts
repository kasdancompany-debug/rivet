const WHISPER_MODEL = process.env.OPENAI_WHISPER_MODEL?.trim() || "whisper-1"
const MAX_BYTES = 25 * 1024 * 1024

export async function transcribeAudioOpenAi(audio: Blob): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return null
  if (audio.size === 0 || audio.size > MAX_BYTES) return null

  const body = new FormData()
  body.append("file", audio, "capture.webm")
  body.append("model", WHISPER_MODEL)
  body.append("language", "en")

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body,
  })

  if (!response.ok) return null

  const payload = (await response.json()) as { text?: string }
  const text = payload.text?.trim()
  return text && text.length > 0 ? text : null
}
