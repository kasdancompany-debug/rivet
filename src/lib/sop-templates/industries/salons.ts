import { withIndustry } from "./_helpers"

export const SALON_INDUSTRY_TEMPLATES = withIndustry("salons", [
  {
    id: "ind-salon-opening-books",
    title: "Salon opening — books, bowls, and basin prep",
    shortDescription:
      "Cash drawer, schedule reality, colour bowls, and basin sanitizer before first colour client.",
    category: "opening",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 35,
    walkthrough_minutes: 10,
    steps: [
      {
        title: "Front desk & drawer",
        instructions:
          "Open POS, baseline drawer, confirm deposits from prior close, print day sheet with gaps flagged.",
      },
      {
        title: "Schedule triage",
        instructions:
          "Double-books, new client consults, and “squeeze-ins” resolved before 10 a.m.—no silent overlaps.",
      },
      {
        title: "Basin & sanitizer",
        instructions:
          "Barbicide at line; fresh towels; disinfectant contact times posted; foils and capes stocked per colour load.",
      },
      {
        title: "Colour bar setup",
        instructions:
          "Scales zeroed; bowls clean; developer dated; waste bowl labelled—no mystery ratios from yesterday.",
      },
    ],
  },
  {
    id: "ind-salon-closing-cashout",
    title: "Salon closing — cashout, chemicals, secure",
    shortDescription:
      "Tips, product pulls, colour waste, and alarm—without tomorrow’s opener discovering sticky bowls.",
    category: "closing",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 40,
    walkthrough_minutes: 9,
    steps: [
      {
        title: "Colour waste",
        instructions:
          "Dispose per local rules; rinse bowls; brushes washed; no developer left in open cups overnight.",
      },
      {
        title: "Retail & backbar counts",
        instructions:
          "High-shrink SKUs spot-count; note variances; lock testers if policy requires.",
      },
      {
        title: "Cashout & tips",
        instructions:
          "Tip pool per house rule; receipts match adjustments; Z report filed—manager signs anomalies.",
      },
      {
        title: "Secure",
        instructions:
          "Hot tools unplugged and cooled on mat; retail locked; alarm; no clients left in processing alone.",
      },
    ],
  },
  {
    id: "ind-salon-sanitation-chemical",
    title: "Salon sanitation & chemical discipline",
    shortDescription:
      "Contact times, patch tests, and ventilation so you pass inspection and protect stylists’ lungs.",
    category: "cleaning",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 25,
    walkthrough_minutes: 9,
    steps: [
      {
        title: "Patch test rule",
        instructions:
          "Lift/lightener: patch test 48h for new colour clients unless waiver on file per jurisdiction—never “just wing it.”",
      },
      {
        title: "Ventilation",
        instructions:
          "Fans on during colour; doors propped only where fire code allows; sensitive clients seated upwind.",
      },
      {
        title: "Tool hygiene",
        instructions:
          "Combs/shears sanitized between guests; neck strips single use; capes laundered on schedule.",
      },
    ],
  },
  {
    id: "ind-salon-guest-boundaries",
    title: "Salon guest expectations — consult, timing, policy",
    shortDescription:
      "Late policy, phone use, children, and refunds—written so stylists do not negotiate from the chair.",
    category: "customer_service",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 20,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Late arrivals",
        instructions:
          "Grace window in minutes; after that, shorten service or reschedule—desk enforces, stylist does not argue time.",
      },
      {
        title: "Redo ladder",
        instructions:
          "Within 48h, same stylist if possible; chemistry issues to lead; cash refund only per owner/manager chart.",
      },
      {
        title: "Photos & content",
        instructions:
          "Model release for marketing; no sneaky TikTok without consent—especially minors.",
      },
    ],
  },
  {
    id: "ind-salon-assistant-first-two-weeks",
    title: "Salon assistant — first two weeks",
    shortDescription:
      "Shampoo-only lanes, fold, sweep, and when they touch colour.",
    category: "training",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 160,
    walkthrough_minutes: 10,
    steps: [
      {
        title: "Week 1: traffic & tone",
        instructions:
          "Greet, robe, beverage offer, timing updates—no formula advice to guests.",
      },
      {
        title: "Week 2: assisted applications",
        instructions:
          "Brush-on under direct eyes of stylist only; no solo processing.",
      },
      {
        title: "Chemical gate",
        instructions:
          "No mixing developer until colour theory module + lead sign-off.",
      },
    ],
  },
  {
    id: "ind-salon-escalation-recovery",
    title: "Salon escalation — chemical burn, slip, hostile guest",
    shortDescription:
      "Who pauses the floor and when the owner gets a same-shift call.",
    category: "emergency",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 20,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Skin or eye reaction",
        instructions:
          "Flush per duration chart; 911 if breathing/swelling worsens; preserve product lot; owner notified after stable.",
      },
      {
        title: "Slip/fall",
        instructions:
          "Incident form; wet floor kit; camera clip only by manager; offer care without admitting fault on scene.",
      },
      {
        title: "Hostile guest",
        instructions:
          "Manager steps in; one warning; end service with refund path per policy—staff never debates alone.",
      },
    ],
  },
  {
    id: "ind-salon-level-expectations",
    title: "Salon level expectations — junior, stylist, lead",
    shortDescription:
      "Who can book colour corrections, extensions, and bridal without owner approval.",
    category: "training",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 22,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Junior",
        instructions:
          "Cut/style tier 1–2; no bleach-on-scalp solo; all colour under supervision until sign-off card.",
      },
      {
        title: "Stylist",
        instructions:
          "Full menu except correction/extension tiers marked “lead+”; maintains rebook rate floor.",
      },
      {
        title: "Lead",
        instructions:
          "Owns education night, dispute comps, and model releases—assigns who covers call-outs.",
      },
    ],
  },
  {
    id: "ind-salon-midday-floor-reset",
    title: "Salon midday floor reset",
    shortDescription:
      "Between peaks: hair on floor, colour mess at station, retail faces, and coffee cups.",
    category: "cleaning",
    importance_level: 3,
    owner_dependency_level: 2,
    estimated_time_minutes: 12,
    walkthrough_minutes: 5,
    steps: [
      {
        title: "Stations",
        instructions:
          "Towels swapped; tools in sanitizer; bowls cleared; no open developer on counters.",
      },
      {
        title: "Guest areas",
        instructions:
          "Magazines straight; music volume; bathroom check; retail dust.",
      },
    ],
  },
  {
    id: "ind-salon-double-book",
    title: "Double-book recovery",
    shortDescription: "Guest-safe options when the book collides.",
    category: "operations",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 10,
    walkthrough_minutes: 3,
    steps: [
      { title: "Acknowledge", instructions: "Apologize once; offer next slot or alternate stylist per manager card." },
    ],
  },
  {
    id: "ind-salon-color-formula",
    title: "Color formula documentation",
    shortDescription: "Every formula logged so guests are not hostage to one stylist.",
    category: "quality",
    importance_level: 4,
    owner_dependency_level: 2,
    estimated_time_minutes: 5,
    walkthrough_minutes: 2,
    steps: [
      { title: "Log", instructions: "Enter formula in guest profile before checkout; photo swatch if custom." },
    ],
  },
  {
    id: "ind-salon-retail-pitch",
    title: "Retail recommendation standard",
    shortDescription: "One honest recommendation tied to service—not a hard sell.",
    category: "guest_experience",
    importance_level: 2,
    owner_dependency_level: 1,
    estimated_time_minutes: 5,
    walkthrough_minutes: 2,
    steps: [
      { title: "Recommend", instructions: "One product tied to service performed; note decline respectfully." },
    ],
  },
  {
    id: "ind-salon-late-guest",
    title: "Late guest policy",
    shortDescription: "Grace window without blowing the rest of the book.",
    category: "guest_experience",
    importance_level: 3,
    owner_dependency_level: 2,
    estimated_time_minutes: 5,
    walkthrough_minutes: 2,
    steps: [
      { title: "Policy", instructions: "15-minute grace; shorten service with guest consent or rebook per front desk card." },
    ],
  },
])
