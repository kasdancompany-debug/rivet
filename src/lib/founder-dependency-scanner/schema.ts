/** Answer index → mapped to dependency points in scoring. */
export const ANSWER_SCALE = [
  { key: 0 as const, label: "Yes, fully", hint: "Clear owner, trained others, or documented." },
  { key: 1 as const, label: "Mostly", hint: "Works most days; gaps under stress or absence." },
  { key: 2 as const, label: "Limited", hint: "Depends on reminders, you, or informal memory." },
  { key: 3 as const, label: "No", hint: "Unknown, not true today, or owner-only." },
] as const

export type AnswerKey = (typeof ANSWER_SCALE)[number]["key"]

export type ScannerQuestion = {
  id: string
  prompt: string
  /** Extra framing for the owner reading the diagnostic. */
  context?: string
}

export type ScannerSection = {
  id: string
  title: string
  lede: string
  questions: ScannerQuestion[]
}

export const SCANNER_SECTIONS: ScannerSection[] = [
  {
    id: "opening_closing",
    title: "Opening & closing",
    lede: "The first and last hours set the tone. If they collapse without you, the rest of the day inherits that fragility.",
    questions: [
      {
        id: "open_alone_non_owner",
        prompt: "Can someone besides the owner open alone?",
        context: "Meaning: lights, cash, prep, and first customers without calling you.",
      },
      {
        id: "close_alone_non_owner",
        prompt: "Can someone besides the owner close alone?",
        context: "Safe, deposits, cleaning, alarms, and shift closeout—without your sign-off.",
      },
      {
        id: "opening_documented",
        prompt: "Is the full opening process documented?",
        context: "Not tribal knowledge—a checklist or SOP the team trusts.",
      },
      {
        id: "closing_documented",
        prompt: "Is the full closing process documented?",
        context: "Same bar: repeatable, auditable, delegatable.",
      },
    ],
  },
  {
    id: "product_quality",
    title: "Product quality",
    lede: "Consistency is where small shops win—or quietly lose customers when you are not on the floor.",
    questions: [
      {
        id: "recipes_documented",
        prompt: "Are recipes documented?",
        context: "Beverages, food builds, dial-in notes—whatever you actually sell.",
      },
      {
        id: "standards_photographed",
        prompt: "Are acceptable product standards photographed?",
        context: "So staff can match the bar, not guess from memory.",
      },
      {
        id: "remake_discard_clear",
        prompt: "Does staff know when to remake or discard a product?",
        context: "Without texting you for judgment calls.",
      },
      {
        id: "others_train_new_hire",
        prompt: "Can someone else train a new employee?",
        context: "On quality and service—not only shadowing you.",
      },
    ],
  },
  {
    id: "ordering_inventory",
    title: "Ordering & inventory",
    lede: "Stockouts and surprise orders are classic owner magnets. Clarity here buys you real calendar back.",
    questions: [
      {
        id: "supplier_ordering_non_owner",
        prompt: "Does someone besides the owner know supplier ordering?",
        context: "Who to call, how much, and when—not just you.",
      },
      {
        id: "par_levels_documented",
        prompt: "Are par levels documented?",
        context: "Written targets someone else can maintain.",
      },
      {
        id: "emergency_substitutions_documented",
        prompt: "Are emergency substitutions documented?",
        context: "When the truck is late or an item is cut.",
      },
    ],
  },
  {
    id: "staff_training",
    title: "Staff & training",
    lede: "If only you can carry culture and standards, the business is still wearing your name on every shift.",
    questions: [
      {
        id: "training_path_new_hires",
        prompt: "Is there a training path for new hires?",
        context: "Structured milestones, not “figure it out beside me.”",
      },
      {
        id: "key_duties_assigned",
        prompt: "Are key duties assigned to specific people?",
        context: "Named ownership—not “everyone kind of knows.”",
      },
      {
        id: "absent_owner_7_days",
        prompt: "Can the business run if the owner is absent for 7 days?",
        context: "Honest answer: could the doors stay open with quality intact?",
      },
    ],
  },
  {
    id: "customer_experience",
    title: "Customer experience",
    lede: "Recovery moments define reputation. If only you can fix a bad experience, you are still on call emotionally.",
    questions: [
      {
        id: "complaint_responses_documented",
        prompt: "Are complaint responses documented?",
        context: "What to say, what to offer, when to escalate.",
      },
      {
        id: "service_standards_documented",
        prompt: "Are customer service standards documented?",
        context: "Greeting, pace, recovery, tone of voice on the floor.",
      },
      {
        id: "refunds_remakes_clear",
        prompt: "Are refunds / remakes rules clear?",
        context: "Staff can resolve within policy without pulling you in.",
      },
    ],
  },
]

export const ALL_QUESTION_IDS = SCANNER_SECTIONS.flatMap((s) =>
  s.questions.map((q) => q.id)
) as readonly string[]

export type ScanAnswers = Partial<Record<string, AnswerKey>>
