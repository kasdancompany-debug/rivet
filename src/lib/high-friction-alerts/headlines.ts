function capitalizeTopic(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return "This procedure"
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

function topicFromText(text: string, maxLen = 48): string {
  const t = text.trim()
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen - 1)}…`
}

export function headlineForAskRepeat(question: string, standardTitle: string | null): string {
  const topic = standardTitle ?? topicFromText(question, 56)
  const lower = `${topic} ${question}`.toLowerCase()
  if (/refund|policy|approv|exception|comp/.test(lower)) {
    return `${capitalizeTopic(topicFromText(topic, 40))} is being searched often`
  }
  if (/opening|close|checklist|open shift/.test(lower)) {
    return `${capitalizeTopic(topicFromText(topic, 40))} has repeated staff questions`
  }
  return `${capitalizeTopic(topicFromText(topic, 40))} is still unclear`
}

export function headlineForInterruptionRepeat(label: string): string {
  const topic = capitalizeTopic(topicFromText(label, 48))
  if (/refund|policy|approv/.test(label.toLowerCase())) {
    return `${topic} is being searched often`
  }
  if (/opening|close|checklist/.test(label.toLowerCase())) {
    return `${topic} has repeated staff questions`
  }
  return `${topic} is still unclear`
}

export function headlineForQuizFail(standardTitle: string, questionPrompt: string): string {
  const play = capitalizeTopic(topicFromText(standardTitle, 40))
  const snippet = topicFromText(questionPrompt.replace(/\?+$/, ""), 36).toLowerCase()
  if (/freezer|load|stock/.test(`${play} ${snippet}`)) {
    return `${play.toLowerCase()} is still unclear`
  }
  return `${play} quiz gap: staff miss the same question`
}

export function headlineForViewsLowTraining(standardTitle: string): string {
  const topic = capitalizeTopic(topicFromText(standardTitle, 48))
  if (/opening|checklist|close/.test(standardTitle.toLowerCase())) {
    return `${topic} has repeated staff questions`
  }
  return `${topic} is viewed often but training is not sticking`
}
