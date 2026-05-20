/**
 * Rivet product copy — operational load, structural gaps, floor-grounded language.
 * Prefer importing from here over scattering new UI strings.
 */

export const COPY = {
  connect: {
    title: "Link your business first",
    description:
      "Rivet needs a real workspace to attach to—otherwise there is no floor to read, no shifts to prove, and no bottlenecks to clear off your phone.",
    cta: "Open settings",
  },

  billing: {
    checkoutCanceledTitle: "Checkout was closed",
    checkoutCanceledBody: "Stripe did not charge your card. When you are ready, continue below to try again.",
  },

  setup: {
    eyebrow: "Step 1 · Workspace",
    title: "Name the operation Rivet will track",
    lead:
      "One field, then you pick your industry template—Rivet installs standards, training, and workflows in under a minute.",
    cardTitle: "Workspace",
    cardDescription:
      "This record is what standards, training, and proof attach to. You can refine the name later in Settings.",
    nameLabel: "Business name",
    namePlaceholder: "e.g. Northside Cafe",
    industryLabel: "How do you mainly run?",
    footerHint: "Next: pick your business type and we preload your foundation—no empty library.",
    submit: "Continue",
    submitting: "Creating workspace…",
  },

  routeRecovery: {
    backOverview: "Back to Overview",
    segmentErrorTitle: "This view did not load",
    segmentErrorBody:
      "Your account is still signed in. You can retry, open Settings if you were linking a workspace, or return to Overview.",
    tryAgain: "Try again",
    openSettings: "Open settings",
    notFoundTitle: "That screen is not in Rivet",
    notFoundBody:
      "The address may be wrong or the page may have moved. Use the sidebar, or go back to Overview or Settings.",
    notFoundOverview: "Go to Overview",
    notFoundSettings: "Open settings",
  },

  settingsWorkspace: {
    title: "Workspace",
    description:
      "Create the business record Rivet uses in Supabase. Until it exists, export and most modules stay empty on purpose—there is no operation to attach to yet.",
    nameLabel: "Business name",
    namePlaceholder: "e.g. Northside Cafe",
    nameHelper: "This is the label Rivet shows for your operation. You can change it later in Supabase if needed.",
    submit: "Create workspace",
    working: "Creating…",
    linkedTitle: "Workspace linked",
    linkedLead: "Rivet is using",
    linkedTrail: " for standards, shifts, and scores.",
    linkedHint: "Invited staff still need profile rows tied to this business; membership tooling is separate.",
    serverSessionRequired:
      "Rivet could not read an authenticated Supabase session for this request. Sign in again, then retry.",
    serverSessionRequiredBypass:
      "Dev mode could not save your workspace. Restart the dev server and try again, or add Supabase keys to .env.local for real persistence.",
    signInToContinue: "Go to sign in",
  },

  shell: {
    tagline: "From “it runs on you” to “it holds without you in every thread.”",
    signedIn: "Signed in",
    accountMenu: "Account menu",
    openMenu: "Open menu",
    navigation: "Navigation",
    settings: "Settings",
    signOut: "Sign out",
  },

  nav: {
    overview: "Overview",
    proofOfTransfer: "Execution proof",
    realityCheck: "Reality check",
    standards: "How the business runs",
    standardsCapture: "Capture a standard",
    training: "Who can carry what",
    shifts: "Can the shift run clean?",
    team: "Backup on the floor",
    bottlenecks: "What still hunts you",
    interruptions: "Owner interruptions",
    escapePlan: "Path off your plate",
    settings: "Settings",
    accountSection: "Account",
  },

  hero: {
    eyebrow: "Owner reliance",
    preview: "Preview",
    relianceSub: "Higher = more of the day still waits on you.",
    autonomyLabel: "Can run without you",
    weekLabel: "This week",
    weekHint: "Logged pulls on you · UTC week",
    weekHoursLeak: (hours: number) => `≈ ${hours} h on the clock`,
    verdictQuestion: "Can the business run without you today?",
    trendLabel: "7-day trend",
    trendHint: "Room to run without you · UTC",
    trendEmpty: "No history here yet.",
    bands: {
      critical: "Heavy on you",
      fragile: "Structural strain",
      improving: "Loosening up",
      stable: "Holding",
      transferable: "Traveling",
    },
    notScoredBadge: "Not scored",
    rivetEmptyPrimary: "—",
    rivetEmptySub: "Add runs, standards, and teaching to unlock the index.",
  },

  dashboard: {
    postCheckoutTitle: "Payment received",
    postCheckoutBody:
      "Stripe confirmed checkout. If anything still looks locked, wait a few seconds for your workspace to update, then refresh this page.",
    postCheckoutDismiss: "Dismiss",
    loadErrorTitle: "Overview could not load",
    loadErrorBody:
      "Your session is unchanged. Retry once—if this keeps happening, open Settings or sign out and back in while we check connectivity.",
    criticalHeading: "What still needs you",
    criticalAllLink: "Everything flagged for you",
    criticalEmpty: "Nothing owner-critical in this slice—breathe once, then keep reinforcing.",
    badgeBottleneck: "Bottleneck",
    badgeStandard: "Standard",
    badgeRisk: "Risk",
    badgeTraining: "Training",
    badgeGap: "Thin write-up",
    statusOpen: "Open",
    statusProgress: "In motion",
    nextEyebrow: "Next move",
    proofHeading: "Execution proof",
    proofFullLink: "See full proof",
    proofEmpty:
      "No completed checklist runs on record yet—finish opening or closing on the floor, then refresh.",
    proofWin: "Off your plate",
    teamHeading: "Who can carry the floor",
    teamLink: "Open teaching",
    teamTrainingDone: "Modules finished",
    teamReadinessAvg: "Floor coverage",
    teamSignals: "What the score sees",
    teamSignalTeam: "People depth",
    teamSignalTrain: "Teaching depth",
    depthHeading: "Under the hood",
    depthExpand: "Where load sits by slice",
    depthExpandHint: "· tap to open",
    depthHeatHint: "Darker = more still tied to you in that slice.",
    warningsHeading: "Heads up",
    metrics: {
      standards: "Standards depth",
      training: "Teaching done",
      bottlenecks: "Open bottlenecks",
      onYou: "Still on you",
    },
    pulseHeading: "Operational pulse",
    pulse: {
      ownerInterruptions: "Owner interruptions this week",
      proceduresMissing: "Procedures missing",
      trainingCompletion: "Training completion",
      issuesUnresolved: "Issues unresolved",
      surviveWithoutOwner: "Survive a week away?",
      rivetScore: "Rivet score",
    },
    metricNoData: "No data yet",
    scoreInsufficientFounderLabel: "Not scored — add operating signal to measure owner load.",
    scoreInsufficientRiskCaption:
      "Rivet is waiting on more floor signal (runs, standards, teaching, or bottlenecks) before it calls concentration levels.",
    executionProofEmpty:
      "No completed checklist runs on record yet—finish a daily run on the floor so execution shows up here.",
    executionProofRun: "Completed run",
    teamSignalsEmpty:
      "Category scores need training assignments or readiness rows to describe people and teaching depth.",
    marketingDemoCaption: "Illustrative numbers for marketing preview only — your live dashboard never fabricates metrics.",
    setupGateTitle: "Link your business to load this overview",
    setupGateBody:
      "Scores, heatmaps, and proof pull from your workspace on the record. Until then, nothing here is estimated—we leave the numbers blank on purpose.",
    setupGateCta: "Open settings",
    setupGateSecondary: "Reality check",
    setupGateFootnote:
      "The full overview—including transfer signals drawn from your workspace—loads after you link a business in Settings.",
    setupScoreMessage:
      "Your Rivet Index appears after you link a business. We do not fabricate dependency reads for an empty workspace.",
    setupCategoryHint: "Fills in once the workspace is linked.",
    setupFounderLabel: "Not measured without a linked business.",
    setupRiskCaption: "No floor read yet.",
    setupNextTitle: "Link your business",
    setupNextDesc: "Name the operation in Settings so this overview can attach to real shifts, plays, and people.",
    setupNextCta: "Open settings",
    coldStartTitle: "Workspace is linked—next, put a few facts on the record",
    coldStartBody:
      "Rivet reads from standards, teaching, shifts, and bottlenecks. With nothing logged yet, the index is only directional. Add one active standard or run a short reality check so the dashboard reflects your real floor.",
    coldStartCtaStandards: "Browse standard templates",
    coldStartCtaReality: "Run reality check",
    premiumSetupEyebrow: "Welcome to Rivet",
    premiumSetupTitle: "Finish workspace setup to open the Overview",
    premiumSetupBody:
      "The Overview reads from a real business record—standards, shifts, teaching, and proof. Start the guided setup to name your operation and choose how you run, then complete the Reality Check.",
    premiumSetupCta: "Start guided setup",
    firstStandardTitle: "Capture your first standard",
    firstStandardBody:
      "Your Reality Check is on file, but nothing is written to the floor yet. One short capture turns tribal knowledge into something the team can run without texting you.",
    firstStandardCta: "Capture a standard",
    errorNextTitle: "Could not load overview",
    errorNextDesc:
      "Something interrupted the data load. Your workspace is still safe—this is usually temporary. Try reloading, or open Settings if you were changing workspace details.",
    errorNextCta: "Try again",
    teamLinkTraining: "Open teaching",
  },

  counters: {
    bottlenecks: "Open messes",
    weekInterrupts: "Interruptions this week",
    needsYou: "Waiting on you",
    trainingDone: "Modules done",
    standardDepth: "Plays fleshed out",
    standardsGapBadge: "Thin plays",
    standardsGapText:
      "Some plays still read too thin to hand off—tighten cash, open/close, and one quality spine first.",
    standardsGapLink: "Open plays",
  },

  heatmap: {
    title: "Load by slice",
    subtitle: "Darker = more of that slice still rides on you.",
  },

  issues: {
    metadataTitle: "What still hunts you",
    eyebrow: "Off your texts",
    title: "What still hunts you",
    description:
      "Near-misses, gear, guests, judgment calls—named so patterns show up and fewer things need your pocket at 9pm.",
    logCta: "Log something",
    tabsAll: "Everything",
    tabsYou: "Needs you",
    tabsOpen: "Not cleared",
    tabsCleared: "Cleared",
    tabsAria: "Bottleneck filters",
    newMetadataTitle: "Log something",
    newEyebrow: "Off your texts",
    newTitle: "Log something",
    newDescription: "Put the block on paper before it becomes a 9pm text chain.",
    newConnectDesc: "Link your business first—then this saves to your floor.",
    newSuccessDescription:
      "Anyone on the team can record what is stuck. Flag when only you can move it—that keeps owner load visible instead of invisible.",
  },

  interruptions: {
    metadataTitle: "Owner interruptions",
    eyebrow: "Operational dependence",
    title: "Where your life is leaking",
    description:
      "Every approval, ping, and judgment call routed back to you is logged here—so the business stops hiding how much it still drinks from your calendar.",
    noBizEyebrow: "Owner pulls",
    noBizTitle: "Where your life is leaking",
    noBizDesc: "Link the workspace first—then the team can log pulls on the owner with a timestamp and a time estimate.",
    logEyebrow: "Fast log",
    logTitle: "Log an interruption",
    logDescription: "Two taps: what kind of pull, how long it burned, one honest line. Done.",
    logSaved: "Saved. It shows on the dashboard immediately.",
    dashboardCta: "Open dashboard",
    logCta: "Log another",
    weekStat: "This week (UTC Mon–Sun)",
    hoursLeak: "Estimated owner time",
    hoursLeakHint: "Sum of time estimates your team logged—rough, but directionally honest.",
    trendTitle: "14-day rhythm",
    trendHint: "Each bar is one UTC day. Taller means more pulls landed on the owner.",
    kindsTitle: "What kind of pull",
    kindsHint: "Where decisions collapse back to you.",
    repeatTitle: "Repeat themes",
    repeatHint: "Same short label logged more than once in this window—fix the system, not the symptom.",
    rolesTitle: "Most dependent roles",
    rolesHint: "Grouped by the role on the roster card—coarse, but it surfaces who’s stuck in your pocket.",
    peopleTitle: "Who logged the most",
    peopleHint: "Usually the people closest to the fire. Pair with teaching and written plays.",
    recentTitle: "Latest on the record",
    recentHint: "Newest first. Names come from the team roster.",
    emptyTrend: "No interruptions logged in this window yet—when they start, the shape shows up here.",
    emptyRepeats: "No repeat themes yet—when the same label shows up twice, it lands here.",
    emptyRoles: "No role signal yet.",
    actionHint: "Log pulls in the moment—before memory rounds the edges.",
    minutesLabel: "Minutes on you",
    summaryLabel: "One-line label",
    summaryPlaceholder: "e.g. “Approve comp for call-out” or “Guest wants exception to policy”",
    detailLabel: "Optional context",
    detailPlaceholder: "What was tried, what was blocked—only if it helps the next fix.",
    kindLabel: "Type",
    submit: "Log it",
    submitting: "Saving…",
    dashboardStripCta: "Open the leak map",
    dashboardStripLoggedSuffix: "logged this week",
    unitPulls: "pulls",
  },

  operations: {
    metadataTitle: "Shifts",
    eyebrowOwner: "Proof on the record",
    titleOwner: "Can the shift run clean?",
    descOwner:
      "Opening and closing with the same checklist every time—so the standard held is visible, not something only you remember.",
    eyebrowStaff: "Your shift",
    titleStaff: "Can the shift run clean?",
    descStaff: "Run open and close from your phone. The dated record is what keeps you out of the group chat.",
    noBizEyebrow: "Shift proof",
    noBizTitle: "Can the shift run clean?",
    noBizDesc: "When the business is linked, this is where today’s open and close live—with receipts.",
    floorLabel: "Today’s checklists",
  },

  training: {
    metadataTitle: "Who can carry what",
    noBizEyebrow: "Teaching",
    noBizTitle: "Who can carry what",
    noBizDesc: "Modules tied to how you actually run—so “trained” means something on the floor, not a checkbox.",
    eyebrow: "Capability",
    title: "Who can carry what",
    description: "Standards linked to people—so opening alone and guest recovery are known quantities, not guesses.",
    newModule: "New module",
    modulesHeading: "Modules",
    emptyTitle: "No modules yet",
    emptyDesc: "Start where you get interrupted most—open, cash, or guest recovery—and wire the plays people should run.",
    emptyCta: "First module",
    exampleEyebrow: "When modules exist",
    exampleDesc: "Progress and readiness pull from the same standards your team already has to hit.",
    teamSectionTitle: "People on the business",
    teamSectionLead:
      "Each card shows modules, completion against linked plays, and the four delegation questions you own.",
    teamEmpty: "No people on this workspace yet—when teammates have accounts, link them to this business from Settings.",
    teamLink: "Open settings",
    employeeCardReadiness: "Trust line",
    employeeDelegationHeading: "What you would trust off-shift",
    employeeDelegationHint:
      "Your call—ground it in what you have watched them run, not in completion ticks alone.",
    employeeModulesHeading: "Modules on them",
    employeeNoModules: "No modules on them yet.",
    employeeDonePlays: (n: number) => `Hit (${n})`,
    employeeRemainingPlays: (n: number) => `Still open (${n})`,
    employeeAddModule: "Add module",
    employeeChooseModule: "Choose a module…",
    employeeAssign: "Assign",
    employeeRemove: "Remove",
    employeeRemoveConfirm: (title: string) => `Pull “${title}” off this person?`,
    employeeSopFootnote: "Checking plays updates the module status automatically.",
  },

  team: {
    metadataTitle: "Backup on the floor",
    eyebrow: "Depth",
    title: "Backup on the floor",
    description: "Who exists beyond you, what they can run alone, and how teaching lines up—so peak isn’t a solo act.",
    emptyEyebrow: "Roster",
    emptyTitle: "Backup list is still building",
    emptyDesc:
      "Teaching already uses the people on your business. This roster-wide view is next—use Who can carry what for per-person cards today.",
    stubNote:
      "No fabricated roster cards here. When this page ships, it will pull the same real readiness data you already see under Teaching.",
    emptyTraining: "Open teaching",
    emptySettings: "Business settings",
  },

  sops: {
    metadataTitle: "How the business runs",
    eyebrow: "The real bar",
    title: "How the business runs",
    descNoBiz: "The plays someone can run without interpreting you—short enough to use on a hot line.",
    desc: "Runnable plays in plain language. When the bar is explicit, fewer decisions boomerang to you.",
    starterTitle: "Starter plays",
    starterBody: "Drop in open, close, bar, bakery, or cash drafts—then tune for your gear, vendors, and house rules.",
    starterCta: "Open gallery",
    gallery: "Starter gallery",
    capture: "Capture a play",
    new: "New play",
    emptyEyebrow: "First play",
    emptyTitle: "Start with what only you still run.",
    emptyDesc: "Pick the question your team asks you most—or grab a draft from the gallery and edit it to your line.",
    browseGallery: "Browse gallery",
    authorScratch: "Write from scratch",
    alertTitle: "No plays yet — you are the system",
    alertBody:
      "Without published plays, teaching has nothing to attach to and shifts have nothing to score. Put open or cash in the library first—then the floor stops improvising under pressure.",
    exampleEyebrow: "When the library has meat",
    exampleDesc: "Audits and opening runs both trace back to the same plays—here is what that looks like filled in.",
    exampleOpeningTitle: "Opening tied to plays (example)",
  },

  templates: {
    metadataTitle: "Starter plays",
    back: "Back to plays",
    title: "Starter plays",
    description: "Industry packs and classics as drafts—tune to your line before anyone runs them under pressure.",
    noBizDesc:
      "Starters land in your play library. Link the operation in Settings, then install drafts in one pass.",
    heroBadge: "Starter gallery",
    heroTitle1: "Packs written for real floors.",
    heroTitle2: "Plus the open, close, cash, and bar starters you already know.",
    heroLead:
      "Each industry ships eight linked drafts—open, close, quality, guest expectations, onboarding, escalation, roles, and a shift checklist. Install one card or the whole pack; everything lands as a draft you own.",
    listEyebrow: "Plays",
    listTitle: "Starter gallery",
    listDesc: "Filter by industry or category. Rename, retune vendors, and check local law before these hit a live line.",
    emptyFilter: "Nothing in this slice.",
    emptyFilterLink: "all starters",
  },

  welcome: {
    dismiss: "Dismiss",
    region: "Welcome",
    onboardingAria: "Welcome strip",
    doneLine: "You already did the honest pass.",
    doneTitle: "The uncomfortable part is on paper—so you can fix it on purpose.",
    doneBody: "Re-open your dependency read when you need a reset, then keep moving load into plays, teaching, and shift proof.",
    reportAgain: "Open report again",
    capture: "Capture a play",
    todoEyebrow: "If you are carrying too much",
    todoTitle: "You are not “bad at delegating.” The work still routes through you.",
    todoBody:
      "Eight blunt questions, one straight read on how fused the operation is to you—no shame, no fluff. Then Rivet helps you move answers into plays your team can run.",
    todoCta: "Five-minute reality check",
    chipSettingsLinked: "Settings",
    chipSettingsUnlinked: "Link business first",
    chipBrowse: "Browse starter plays",
  },

  proofPage: {
    title: "Execution proof",
    lead: "Evidence the operation can carry load without routing every judgment through you—not vibes, what the record shows.",
    backOverview: "Owner overview",
    openStandards: "Open standards",
    unlinkedHeadline: "Execution proof attaches to your business",
    unlinkedLead:
      "Link the operation in Settings. Wins from shifts, teaching depth, and cleared bottlenecks land here as they happen—no demo filler.",
  },

  proofPanel: {
    eyebrow: "Execution proof",
    signalMix: "Signal mix",
    signals: (n: number) => `${n} signals`,
    bucketTransferred: "Off your plate",
    bucketTransferredDesc: "Things the team proved they can carry.",
    bucketFragile: "Still uneven",
    bucketFragileDesc: "Moving, but not trustworthy yet under pressure.",
    bucketOwner: "On you",
    bucketOwnerDesc: "Still concentrated until plays, teaching, or clears happen.",
    bucketStable: "Steadier",
    bucketStableDesc: "Signals holding calmer as you reinforce structure.",
    bucketEmpty: "Nothing here right now.",
    productSurface: "Product surface",
    introTitle: "The same views your team runs",
    introBody:
      "Checklists, audits, teaching depth, dependency—shown as proof, not mockups. Your workspace replaces this with live data.",
    illustrative: "Examples use fixed demo lines—your account shows your business.",
    introReceipts:
      "Each card ties to shift proof, readiness, bottlenecks, or Rivet Index history—not a wish list.",
  },

  coach: {
    unlinkedTitle: "Outside read needs a linked business",
    unlinkedLead:
      "This brief is built only from your workspace signals. Link the operation in Settings, then come back for a grounded read—nothing here is invented.",
    unlinkedCta: "Open settings",
    errorTitle: "Could not load Outside read",
    errorLead: "Try again in a moment. If it keeps failing, refresh the page or check your connection.",
    retryCta: "Try again",
  },

  onboarding: {
    questionProgress: (i: number, n: number) => `Question ${i} of ${n}`,
    introEyebrow: "Reality check",
    reportEyebrow: "Dependency read",
    reportIndexLabel: "How fused you are to the operation",
    reportIndexHint:
      "Higher = more still rides on your judgment, memory, and presence—not because you want it that way, but because the system is not finished yet.",
    bandCritical: "Heavy load",
    bandStrained: "Strained",
    bandContained: "Earlier than it feels",
    heardHeading: "What we heard",
    uncomfortableHeading: "The straight truth",
    stakesHeading: "If nothing changes",
    movesHeading: "Your first moves here",
    movesOpen: "Open →",
    persistIdle: "Saved on this device. Retake anytime.",
    persistSaving: "Saving to your workspace…",
    persistSaved: "Saved into your overview inputs.",
    persistSkipped: "Create your workspace first (Overview → guided setup), then save again to keep this in history.",
    persistError: "Could not save—your read is still here on this device.",
    retake: "Retake",
    backOverview: "Back to overview",
    livePreview: (n: number) => `Live preview index: ${n}/100`,
    begin: "Begin",
    continue: "Continue",
    seeReport: "See read",
    back: "Back",
    reportIntroCard1:
      "Rivet is for owners who are tired of being the glue between what you meant and what happened on the floor.",
    reportIntroCard2: "We will not shame you for working hard. We will map where the load is structurally stuck.",
  },

  readinessQuestions: [
    { field: "open_alone" as const, label: "Can they open alone?" },
    { field: "close_alone" as const, label: "Can they close alone?" },
    { field: "train_others" as const, label: "Can they teach the next person?" },
    { field: "handle_complaints" as const, label: "Can they handle a hard guest without you?" },
  ],

  readinessBadges: {
    not_ready: "Still needs you close",
    learning: "Building",
    ready_with_support: "OK if you are one text away",
    fully_ready: "Can own it",
  },

  ownerWizard: {
    intro: {
      title:
        "If you are wiped and still the answer key, that is not drama—that is the floor telling the truth.",
      lead:
        "Blunt questions, then a straight read of how much still routes through you—and what to bump first so the line can carry more without you as human middleware.",
      speed: "Under five minutes. Answer like nobody is grading you—because nobody is.",
    },
    days: {
      title: "How many days a week does the business own you?",
      subtitle: "Count the days you are mentally on—even when you are not on the line the whole time.",
      choices: [
        { value: "0-2" as const, label: "0–2 days", hint: "Part-time owner or mostly off floor" },
        { value: "3-4" as const, label: "3–4 days", hint: "Heavy week, but not seven-on" },
        { value: "5-6" as const, label: "5–6 days", hint: "The business owns most of your calendar" },
        { value: "7" as const, label: "7 days", hint: "No clean off switch yet" },
      ],
    },
    open: {
      title: "Can someone else open clean without you?",
      subtitle: "Not “they help sometimes”—can the place open right if you do not show?",
      choices: [
        { value: "yes" as const, label: "Yes", hint: "A trained opener can run start to finish" },
        { value: "sometimes" as const, label: "Sometimes", hint: "Holds until an exception hits" },
        { value: "no" as const, label: "No", hint: "It still routes through you" },
      ],
    },
    close: {
      title: "Can someone else close clean without you?",
      subtitle: "Cash, deposits, alarms, temps, cleanup—with you out of the building.",
      choices: [
        { value: "yes" as const, label: "Yes", hint: "A trained closer can finish safely" },
        { value: "sometimes" as const, label: "Sometimes", hint: "Depends on the night" },
        { value: "no" as const, label: "No", hint: "You are still closer of last resort" },
      ],
    },
    interrupts: {
      title: "How often does the team pull you out of flow?",
      subtitle: "Texts, shoulder taps, “quick questions” that break what you were doing.",
      choices: [
        { value: "rarely" as const, label: "Rarely" },
        { value: "weekly" as const, label: "A few times a week" },
        { value: "daily" as const, label: "Most days" },
        { value: "constant" as const, label: "All day", hint: "It barely stops" },
      ],
    },
    breaks: {
      title: "What wobbles first when you step away?",
      subtitle: "One honest sentence. If it is a chain, name the first domino.",
      labelSr: "What wobbles when you step away",
      placeholder:
        "e.g. Line speeds up but quality slips, or cash waits because only I know the vendor workaround.",
      footnote: "Optional—and the read is sharper when you name the crack.",
    },
    timeoff: {
      title: "Have you skipped real time off because the business cannot release you?",
      subtitle: "Not vacation photos—days you could actually go dark.",
      choices: [
        { value: "yes" as const, label: "Yes" },
        { value: "no" as const, label: "No" },
        {
          value: "prefer_not" as const,
          label: "Prefer not to say",
          hint: "We will still generate your read",
        },
      ],
    },
    standards: {
      title: "Are plays on paper—or mostly in your head?",
      subtitle: "What a new hire actually inherits on day one.",
      choices: [
        { value: "documented" as const, label: "Written", hint: "Runnable plays people can follow" },
        { value: "mixed" as const, label: "Mixed", hint: "Some written, lots of tribal knowledge" },
        { value: "verbal" as const, label: "Mostly verbal", hint: "“Ask the owner” is still a workflow" },
      ],
    },
    quality: {
      title: "Does quality still ride on one pair of hands?",
      subtitle: "When the “right” plate still needs a specific person on the line.",
      choices: [
        { value: "yes" as const, label: "Yes" },
        { value: "no" as const, label: "No", hint: "Quality holds across people" },
        { value: "unsure" as const, label: "Not sure", hint: "Depends on the day" },
      ],
    },
  },

  escape: {
    metadataTitle: "Path off your plate",
    eyebrow: "Paced, not performative",
    title: "Path off your plate",
    desc:
      "Escape Readiness scores whether a week away is plausible from live procedures, training, owner dependencies, and staffing—then six guided moves to improve it.",
    noBizEyebrow: "Six moves",
    noBizTitle: "Path off your plate",
    noBizDesc:
      "Same arc lives here once the business is linked: capture plays, teach them, transfer calls, shrink approvals, test stability, then step back with proof.",
  },

  placeholders: {
    teamRouteTitle: "Backup on the floor",
    teamRoutePurpose:
      "One read on who can cover peaks, where teaching is thin, and when call-outs still hunt you—once roster depth is enabled for this workspace.",
    teamRouteBody:
      "This route is staged behind a feature flag. Your teaching data is still live under Who can carry what—use that until the roster-wide view ships here.",
    teamRoutePrimary: "Who can carry what",
    coachRouteTitle: "Outside read",
    coachRoutePurpose:
      "A structured brief from standards, teaching, shifts, and bottlenecks—optional signal, not a second dashboard.",
    coachRouteBody:
      "Outside read is disabled for this deployment. Rivet Index, execution proof, and bottlenecks stay on the main navigation.",
    coachRoutePrimary: "Workspace & account",
  },
} as const
