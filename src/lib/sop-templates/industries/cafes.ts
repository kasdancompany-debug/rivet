import { withIndustry } from "./_helpers"

export const CAFE_INDUSTRY_TEMPLATES = withIndustry("cafes", [
  {
    id: "ind-cafe-opening-run",
    title: "Cafe opening — line-ready floor",
    shortDescription:
      "Alarm, cash baseline, bar dial-in, case integrity, and first-guest readiness without improvising.",
    category: "opening",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 40,
    walkthrough_minutes: 11,
    steps: [
      {
        title: "Safe & cash baseline",
        instructions:
          "Two-person rule if policy requires: verify safe combo change log, count opening drawer to baseline sheet, and note variance >$5 before first sale.",
      },
      {
        title: "Espresso & grinder sanity",
        instructions:
          "Machine at setpoint; purge groups; dial grind within recipe window on house espresso; log grinder number on opening tasting line.",
      },
      {
        title: "Milk & dairy chain",
        instructions:
          "Check fridge temps (photo if out of band), FIFO dairy and alt-milks, discard anything past use-by with initials on waste log.",
      },
      {
        title: "Case & pastry integrity",
        instructions:
          "Case temps logged; labels facing guests; overnight pulls from walk-in match prep list; anything out of spec gets a “do not sell” card and manager photo.",
      },
      {
        title: "FOH guest path",
        instructions:
          "Menus correct for dayparts, 86 list synced POS ↔ line, spill kit stocked, and first guest greeting script posted at register.",
      },
      {
        title: "Shift comms",
        instructions:
          "Post expected peak window + any known vendor gaps in team channel; assign float for line-buster if scheduled.",
      },
    ],
  },
  {
    id: "ind-cafe-closing-secure",
    title: "Cafe closing — cash, case, secure building",
    shortDescription:
      "Last-call through alarm: cash discipline, bar shutdown, case wrap, and no propped doors.",
    category: "closing",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 55,
    walkthrough_minutes: 12,
    steps: [
      {
        title: "Last-call & waste truth",
        instructions:
          "Last call 30 min out; pull samples; mark comps and training drinks; waste reasons initials—not “misc.”",
      },
      {
        title: "Bar shutdown that survives audit",
        instructions:
          "Knock box, backflush per schedule, steam wands stripped of milk film, syrup rails wiped, and machine left in overnight standby per manufacturer card.",
      },
      {
        title: "Case & dairy night mode",
        instructions:
          "Wrap or cover case product, night labels, walk-in transfer list checked, dairy restocked for opener list only—no mystery tubs.",
      },
      {
        title: "Cash & drops",
        instructions:
          "POS close per cash SOP; two-person drop if required; Z report stapled to envelope; variances flagged before anyone leaves.",
      },
      {
        title: "Secure building",
        instructions:
          "Dumpsters only if on chore chart; lights/music; patio locked; alarm armed from designated door—never prop for “two minutes.”",
      },
    ],
  },
  {
    id: "ind-cafe-quality-line",
    title: "Cafe line quality — taste, temps, and pace",
    shortDescription:
      "What “good” means on the line: extraction, milk texture, and speed without trashing standards.",
    category: "training",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 25,
    walkthrough_minutes: 9,
    steps: [
      {
        title: "Espresso strip & TDS spot",
        instructions:
          "Pull one strip every peak window start; if outside window, adjust grind in micro steps and re-log before serving guests.",
      },
      {
        title: "Milk texture bar",
        instructions:
          "Microfoam shine, no large bubbles, temp stop before scorch; alternatives get own pitcher color code—no cross-pour.",
      },
      {
        title: "Speed without shortcuts",
        instructions:
          "If queue >8 orders, activate call-backs and second bar—never skip rinse or skip purge “to catch up.”",
      },
      {
        title: "86 integrity",
        instructions:
          "POS 86, line board, and pastry tag must match; if mismatch, stop line 60 seconds to reconcile—guests prefer honesty over wrong drink.",
      },
    ],
  },
  {
    id: "ind-cafe-guest-recovery",
    title: "Cafe guest service — recovery & boundaries",
    shortDescription:
      "Scripts for long waits, wrong drinks, and regulars who test policy—without staff improvising refunds.",
    category: "customer_service",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 20,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Wait-time script",
        instructions:
          "If quoted wait >10 minutes: acknowledge by name if known, offer water, give honest ETA—never promise what the line cannot hit.",
      },
      {
        title: "Remake ladder",
        instructions:
          "First mistake: remake + apology. Second same visit: lead involved. Comp beyond policy requires manager code—not barista guess.",
      },
      {
        title: "Allergies",
        instructions:
          "Repeat order back; flag cup; if any doubt on cross-contact, decline politely and offer bottled option—ego is cheaper than ER.",
      },
      {
        title: "Regulars & “just this once”",
        instructions:
          "Free drink policy is written; deviations go to manager channel with reason—no side deals that train the whole room.",
      },
    ],
  },
  {
    id: "ind-cafe-shift-zero-to-one",
    title: "Cafe onboarding — first two shifts",
    shortDescription:
      "Shadow map, food-safety non-negotiables, and when they are allowed to talk to guests alone.",
    category: "training",
    importance_level: 5,
    owner_dependency_level: 3,
    estimated_time_minutes: 180,
    walkthrough_minutes: 12,
    steps: [
      {
        title: "Day-zero paperwork & tour",
        instructions:
          "Handbook sign, allergy overview, hand-wash demo, where breaks and phones live—photos only in staff areas.",
      },
      {
        title: "Shadow map",
        instructions:
          "Shift 1: observe only except bussing/rinsing. Shift 2: register with coach shadowing every cash interaction.",
      },
      {
        title: "Bar gate",
        instructions:
          "No solo milk drinks until steam cert initials; no dialing alone until lead signs bar-basics card.",
      },
      {
        title: "Micro-debrief",
        instructions:
          "10 minutes end of each shift: one win, one fix, tomorrow’s focus—trainer initials checklist.",
      },
    ],
  },
  {
    id: "ind-cafe-incident-escalation",
    title: "Cafe incidents — escalation & owner pull",
    shortDescription:
      "Food injury, harassment, equipment fire-risk, and cash over threshold—who acts first and when you get called.",
    category: "emergency",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 25,
    walkthrough_minutes: 10,
    steps: [
      {
        title: "Guest injury or allergic reaction",
        instructions:
          "911 if breathing difficulty; manager owns scene; preserve cup/label; owner notified after guest stable—never debate liability on the floor.",
      },
      {
        title: "Harassment or threat",
        instructions:
          "Staff safety first; remove guest if policy allows; incident log with witnesses; law enforcement if weapon or threat—owner loop within same shift.",
      },
      {
        title: "Equipment hazard",
        instructions:
          "Tag out machine; unplug if safe; post “do not use”; photo to maintenance channel; owner if smoke, gas smell, or repeated trip.",
      },
      {
        title: "Cash variance & theft suspicion",
        instructions:
          "Secure drawer; camera review only by manager; owner if pattern or >policy threshold—no public accusations.",
      },
    ],
  },
  {
    id: "ind-cafe-roles-bench",
    title: "Cafe roles — lead, bar, register, prep",
    shortDescription:
      "Decision rights so the shift does not collapse into “whoever grabs the owner.”",
    category: "training",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 22,
    walkthrough_minutes: 8,
    steps: [
      {
        title: "Lead owns",
        instructions:
          "86 calls, comp caps, shift swaps, vendor short acceptance, and conflict between stations—lead initials exceptions.",
      },
      {
        title: "Bar owns",
        instructions:
          "Dial, milk quality, bar flow, and barista-to-barista coaching—register does not override bar on extraction.",
      },
      {
        title: "Register owns",
        instructions:
          "Queue narrative, refunds per ladder, cash pulls to schedule—register does not promise custom drinks not on spec.",
      },
      {
        title: "Prep owns",
        instructions:
          "Par levels, FIFO, doneness labels—prep does not change case pricing; that is lead + POS.",
      },
    ],
  },
  {
    id: "ind-cafe-midshift-ops-audit",
    title: "Cafe mid-shift ops checklist",
    shortDescription:
      "Peak-before-peak pass: backups, sanitizer PPM, trashes, and line-of-sight hazards.",
    category: "cleaning",
    importance_level: 3,
    owner_dependency_level: 2,
    estimated_time_minutes: 15,
    walkthrough_minutes: 6,
    steps: [
      {
        title: "Sanitizer & towels",
        instructions:
          "Test quat/PPM strips at bar and FOH sink; swap towels; log if out of band with corrective action.",
      },
      {
        title: "Trashes & glass",
        instructions:
          "Bins before overflow; broken glass kit stocked; patio bussed if in use.",
      },
      {
        title: "Line-of-sight safety",
        instructions:
          "Mats flat, cords routed, high chairs stable, spill cones if floor wet—photo if anything needs maintenance ticket.",
      },
      {
        title: "Backup stock",
        instructions:
          "Cups, lids, stoppers, oat/soy backup, receipt paper—two-deep rule before peak.",
      },
    ],
  },
  {
    id: "ind-cafe-86-menu-sync",
    title: "86 list & menu sync",
    shortDescription: "Keep POS, line board, and mobile menus aligned when items drop.",
    category: "operations",
    importance_level: 4,
    owner_dependency_level: 2,
    estimated_time_minutes: 10,
    walkthrough_minutes: 4,
    steps: [
      {
        title: "Confirm the drop",
        instructions:
          "Verify stock or equipment reason; name the item once in the team channel—no conflicting messages.",
      },
      {
        title: "Update every surface",
        instructions:
          "86 in POS, wipe chalkboard or digital menu, and check third-party delivery portals if applicable.",
      },
    ],
  },
  {
    id: "ind-cafe-equipment-down",
    title: "Equipment down — espresso or grinder",
    shortDescription: "Guest-safe fallback when primary bar equipment fails mid-shift.",
    category: "operations",
    importance_level: 5,
    owner_dependency_level: 4,
    estimated_time_minutes: 20,
    walkthrough_minutes: 6,
    steps: [
      {
        title: "Guest messaging",
        instructions:
          "Post limited menu at register; offer batch brew or alternative drinks per fallback card.",
      },
      {
        title: "Vendor / owner ping",
        instructions:
          "Log downtime start, last cleaning cycle, and error code; escalate per escalation SOP if not back in 30 minutes.",
      },
    ],
  },
  {
    id: "ind-cafe-vendor-delivery",
    title: "Vendor delivery receive",
    shortDescription: "Milk, pastry, and dry goods checked in without walk-in chaos.",
    category: "operations",
    importance_level: 3,
    owner_dependency_level: 2,
    estimated_time_minutes: 25,
    walkthrough_minutes: 7,
    steps: [
      {
        title: "Check against PO",
        instructions:
          "Count cases, note shorts on delivery ticket, and refuse warm dairy on hot trucks.",
      },
      {
        title: "FIFO & labels",
        instructions:
          "Date-label opens, rotate walk-in, and move invoice to manager clip for payment.",
      },
    ],
  },
  {
    id: "ind-cafe-catering-handoff",
    title: "Catering pickup handoff",
    shortDescription: "Named orders leave with correct labels, temps, and payment status.",
    category: "guest_experience",
    importance_level: 4,
    owner_dependency_level: 3,
    estimated_time_minutes: 15,
    walkthrough_minutes: 5,
    steps: [
      {
        title: "Verify order ticket",
        instructions:
          "Match name, time, item count, and allergy flags to the production label before bagging.",
      },
      {
        title: "Temp & sign-off",
        instructions:
          "Hot items vented; cold items on ice if delayed; obtain initials on pickup log or photo for large orders.",
      },
    ],
  },
])
