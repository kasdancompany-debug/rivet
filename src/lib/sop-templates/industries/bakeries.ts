import { withIndustry } from "./_helpers"

export const BAKERY_INDUSTRY_TEMPLATES = withIndustry("bakeries", [
  {
    id: "ind-bake-production-open",
    title: "Bakery production open — proof, oven, sanitation",
    shortDescription:
      "Dough temps, oven line-up, allergen separation, and first tray out the door on time.",
    category: "opening",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 50,
    walkthrough_minutes: 12,
    steps: [
      {
        title: "Hand wash & allergen lane",
        instructions:
          "Colour tools for gluten-free vs wheat; if lane compromised overnight, sanitize and re-verify before GF mix.",
      },
      {
        title: "Walk-in & proofer temps",
        instructions:
          "Log walk-in and proofer; corrective action if out of band—do not “ride it” through morning rush.",
      },
      {
        title: "Oven line-up",
        instructions:
          "Deck order matches bake schedule; steam pans filled; vent hood on; first SKU timer set before loading.",
      },
      {
        title: "Mixer safety",
        instructions:
          "Guards down; speed ramp; never hands in bowl; lockout if guard switch flaky—tag out until maintenance.",
      },
      {
        title: "Case staging continuity",
        instructions:
          "FOH case list vs BOH finish times—if short, 86 early rather than underbake.",
      },
    ],
  },
  {
    id: "ind-bake-production-close",
    title: "Bakery production close — cool, clean, schedule",
    shortDescription:
      "Cooling racks cleared, ovens safe, preferments started, and tomorrow’s mix sheet posted.",
    category: "closing",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 55,
    walkthrough_minutes: 11,
    steps: [
      {
        title: "Oven cool-down",
        instructions:
          "Last loads out; doors cracked per spec; no racks blocking vents; overnight retarder set if recipe requires.",
      },
      {
        title: "Sanitation pass",
        instructions:
          "Tables, scales, bowls washed; floor under mixer; drains free; photo if anything sticky remains after first pass.",
      },
      {
        title: "Preferment & poolish",
        instructions:
          "Next-day starters mixed to schedule; label with time/temp target; nothing anonymous in walk-in.",
      },
      {
        title: "Waste & donation log",
        instructions:
          "Weights and reasons; donation bags labeled and temp-logged if regulatory requirement applies.",
      },
    ],
  },
  {
    id: "ind-bake-quality-holds",
    title: "Bakery quality — crumb, finish, and hold times",
    shortDescription:
      "Doneness, shine, and shelf-life—so wholesale does not get a different product than the case.",
    category: "training",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 28,
    walkthrough_minutes: 9,
    steps: [
      {
        title: "Internal temp & colour bar",
        instructions:
          "SKU-specific temp bands and crust colour photos on wall—if borderline, lead cuts one and signs pass/fail.",
      },
      {
        title: "Glaze & garnish window",
        instructions:
          "Cool before glaze or it cracks; garnish within window so sugar does not weep—timer discipline.",
      },
      {
        title: "Hold & discard",
        instructions:
          "Case vs wholesale hold tags; discard at time, not “still looks fine”—guest trust is the asset.",
      },
    ],
  },
  {
    id: "ind-bake-wholesale-counter",
    title: "Bakery wholesale & pickup counter",
    shortDescription:
      "Invoice match, cold chain, and “sorry we’re short” without arguing with accounts.",
    category: "customer_service",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 22,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Pick accuracy",
        instructions:
          "Pick list vs rack labels; photo pack if account requires; shortages flagged before driver leaves.",
      },
      {
        title: "Cold chain",
        instructions:
          "Frozen items in pre-chilled bags; temp strip on long routes if policy says so.",
      },
      {
        title: "Account disputes",
        instructions:
          "No on-the-spot credits over threshold—lead or owner per chart; always get signature on changed counts.",
      },
    ],
  },
  {
    id: "ind-bake-apprentice-path",
    title: "Bakery apprentice — first week on dough",
    shortDescription:
      "What they can mix alone, what needs sign-off, and when they touch the oven.",
    category: "training",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 240,
    walkthrough_minutes: 11,
    steps: [
      {
        title: "Days 1–2 scale & wash only",
        instructions:
          "Weights to gram, FIFO pulls, dish—no solo oven loads.",
      },
      {
        title: "Days 3–4 mix with coach",
        instructions:
          "Mix to hydration spec; coach checks window; apprentice initials batch card only after coach sign.",
      },
      {
        title: "Oven gate",
        instructions:
          "No solo rack push until burn training + lead sign; first solo only on small SKUs.",
      },
    ],
  },
  {
    id: "ind-bake-safety-escalation",
    title: "Bakery safety escalation — burns, glass, allergens",
    shortDescription:
      "Stop-work, first aid, and recall triggers without improvising on the line.",
    category: "emergency",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 22,
    walkthrough_minutes: 9,
    steps: [
      {
        title: "Burn or cut",
        instructions:
          "First aid kit; glove change; if serious, 911 + stop line near scene; incident form same shift.",
      },
      {
        title: "Glass in product area",
        instructions:
          "Stop production in zone; full sweep; magnet pass if applicable; lead clears restart.",
      },
      {
        title: "Allergen cross-contact suspect",
        instructions:
          "Quarantine batch; do not sell; owner + recipe review before release—document lot numbers.",
      },
    ],
  },
  {
    id: "ind-bake-roles-bench",
    title: "Bakery roles — mixer, oven, finisher, pack",
    shortDescription:
      "Who owns the schedule board and who can override the 86 list.",
    category: "training",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 18,
    walkthrough_minutes: 7,
    steps: [
      {
        title: "Mixer",
        instructions:
          "Owns batch integrity and timing to proofer—does not change formula without head baker note.",
      },
      {
        title: "Oven",
        instructions:
          "Owns rack order and temps—calls holds if case needs pulls; communicates to finisher.",
      },
      {
        title: "Head baker",
        instructions:
          "Owns 86, wholesale priority, and recipe deviations—only role that signs new trial SKUs to case.",
      },
    ],
  },
  {
    id: "ind-bake-morning-case-audit",
    title: "Bakery morning case audit",
    shortDescription:
      "Before doors: labels, rotation, nut signage, and empty holes handled honestly.",
    category: "inventory",
    importance_level: 4,
    owner_dependency_level: 2,
    estimated_time_minutes: 14,
    walkthrough_minutes: 6,
    steps: [
      {
        title: "Signage & allergens",
        instructions:
          "Contains-nuts cards match SKUs; if unsure, pull SKU until verified—never guess.",
      },
      {
        title: "Rotation & faces",
        instructions:
          "Oldest sellable front; faces full or intentionally sparse with honest 86 on menu board.",
      },
      {
        title: "Sample discipline",
        instructions:
          "Samples from approved tray only; tongs; no loose crumbs on nut-free SKUs.",
      },
    ],
  },
])
