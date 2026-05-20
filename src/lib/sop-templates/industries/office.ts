import { compactSop } from "./_compact"
import { withIndustry } from "./_helpers"

export const OFFICE_INDUSTRY_TEMPLATES = withIndustry("office", [
  compactSop(
    "ind-office-day-open",
    "Office day start — systems & priorities",
    "Inbox, calendar, and team channel aligned before client work.",
    "opening",
    [
      { title: "Systems check", instructions: "VPN, phone queue, CRM, and shared drive accessible—post in #ops if anything down." },
      { title: "Daily priorities", instructions: "Top three outcomes on team board; block focus time on calendar." },
    ],
    { importance: 4, ownerDep: 3, minutes: 20 }
  ),
  compactSop(
    "ind-office-day-close",
    "Office day close — handoff & backup",
    "End-of-day notes so tomorrow does not restart from zero.",
    "closing",
    [
      { title: "Client follow-ups", instructions: "Log calls and emails in CRM; schedule callbacks with owner tags if needed." },
      { title: "Files & backup", instructions: "Save working docs to shared drive; sensitive prints shredded per policy." },
    ],
    { importance: 4, ownerDep: 2, minutes: 15 }
  ),
  compactSop(
    "ind-office-client-onboarding",
    "New client onboarding",
    "Kickoff packet, access, and success criteria in one pass.",
    "training",
    [
      { title: "Kickoff", instructions: "Send welcome packet, collect signed agreements, and book 30-day check-in." },
      { title: "Access", instructions: "Provision accounts per checklist; revoke test logins after go-live." },
    ]
  ),
  compactSop(
    "ind-office-deliverable-qa",
    "Deliverable QA before send",
    "Nothing leaves with the owner as the only reviewer.",
    "product_quality",
    [
      { title: "Peer review", instructions: "Second pair of eyes on numbers and client name before external send." },
      { title: "Version control", instructions: "File named per convention; final PDF locked in client folder." },
    ]
  ),
  compactSop(
    "ind-office-escalation",
    "Client escalation ladder",
    "When account lead vs practice lead vs owner joins the thread.",
    "other",
    [
      { title: "Account lead", instructions: "Scope disputes, timeline slips, and tone issues—lead responds within 4 business hours." },
      { title: "Owner", instructions: "Legal threat, data breach suspicion, or contract termination request." },
    ]
  ),
  compactSop(
    "ind-office-new-hire",
    "New hire first two weeks",
    "Shadow, tools, and first owned task with sign-off.",
    "training",
    [
      { title: "Week one", instructions: "Tools provisioned, shadow three client calls, complete security training." },
      { title: "Week two", instructions: "Own one internal project with mentor review before client-facing solo work." },
    ]
  ),
  compactSop(
    "ind-office-meeting-facilitation",
    "Internal meeting facilitation",
    "Agenda, notes, and actions—no mystery follow-ups.",
    "other",
    [
      { title: "Before", instructions: "Agenda in invite 24h ahead; pre-read linked." },
      { title: "After", instructions: "Notes with owners and due dates in task system within 2 hours." },
    ]
  ),
  compactSop(
    "ind-office-roles",
    "Team role & coverage map",
    "Who covers phones, inbox, and approvals when someone is out.",
    "other",
    [
      { title: "Coverage", instructions: "Post weekly coverage in team channel; backup named for each client account." },
      { title: "Approvals", instructions: "Expenses and contracts over threshold need second signature per matrix." },
    ]
  ),
  compactSop(
    "ind-office-data-handling",
    "Client data handling",
    "PII stays in approved systems—no shadow spreadsheets.",
    "other",
    [
      { title: "Storage", instructions: "Client files only in approved drive; no local downloads without exception log." },
      { title: "Sharing", instructions: "Password-protected links expire in 7 days; verify recipient email." },
    ]
  ),
  compactSop(
    "ind-office-pto-handoff",
    "PTO handoff checklist",
    "Clients and teammates know who to contact when you are out.",
    "other",
    [
      { title: "Client notice", instructions: "Send coverage email template; update voicemail and calendar OOO." },
      { title: "Open loops", instructions: "List open tasks with status red/yellow/green in handoff doc." },
    ]
  ),
  compactSop(
    "ind-office-vendor-invoice",
    "Vendor invoice approval",
    "Match PO, code, and budget before pay.",
    "cash_handling",
    [
      { title: "Match", instructions: "Invoice to PO and delivery; flag duplicates." },
      { title: "Code & pay", instructions: "GL code from chart; batch for AP cutoff per calendar." },
    ]
  ),
  compactSop(
    "ind-office-weekly-ops",
    "Weekly ops review",
    "Pipeline, capacity, and blockers without owner-only status updates.",
    "cleaning",
    [
      { title: "Pipeline", instructions: "Update CRM stages; stale deals flagged with next action." },
      { title: "Capacity", instructions: "Team load visible; rebalance before overtime becomes normal." },
    ]
  ),
])
