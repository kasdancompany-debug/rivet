import { QuestionsPreventedIntelligencePanel } from "@/components/ask-rivet/questions-prevented-intelligence-panel"
import { cn } from "@/lib/utils"

export async function QuestionsPreventedSection({ className }: { className?: string }) {
  return <QuestionsPreventedIntelligencePanel className={className} variant="compact" />
}
