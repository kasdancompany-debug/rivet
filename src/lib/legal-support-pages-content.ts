/**
 * Plain-language placeholders for legal and support pages.
 * **Do not treat as legal advice.** Counsel should review before production use.
 */

export const LEGAL_REVIEW_BANNER =
  "Legal review: This page is placeholder copy for a small-business audience. Have qualified legal counsel review and replace it before you rely on it in disputes, filings, or customer commitments."

export const SUPPORT_CONTENT_REVIEW_NOTE =
  "Replace the contact email and adjust response-time language to match what your team can actually deliver. Legal review if this text is referenced in contracts or order forms."

export const SUPPORT_CONTACT_EMAIL_PLACEHOLDER = "support@yourdomain.com"

export const termsPage = {
  title: "Terms of service",
  metaDescription: "Placeholder terms of service for Rivet. Legal review required before production.",
  sections: [
    {
      heading: "About these terms",
      body: [
        "These terms describe how we expect Rivet to be used while this site is in draft or early production. They are not tailored to your jurisdiction, industry, or data practices until a lawyer adapts them.",
        "By using Rivet after we publish a dated version you agree to, you accept that version. Until then, consider access experimental.",
      ],
    },
    {
      heading: "The service",
      body: [
        "Rivet provides software and related content to help you document and run operational workflows (for example standards, checklists, and internal visibility). Features can change as we ship improvements.",
        "We do not promise uninterrupted or error-free operation. We may suspend or limit access for maintenance, abuse prevention, or legal reasons.",
      ],
    },
    {
      heading: "Your account and content",
      body: [
        "You are responsible for the accuracy of information you enter, for who you invite to your workspace, and for complying with laws that apply to you (including privacy and employment laws where relevant).",
        "You keep ownership of your content. We need a limited license to host, process, and display it so the product works—exact scope should be confirmed with counsel in your final terms.",
      ],
    },
    {
      heading: "Fees",
      body: [
        "Paid access, if offered, is described at checkout and in separate billing materials. Taxes and currency depend on how you purchase.",
      ],
    },
    {
      heading: "Disclaimer",
      body: [
        "Rivet is provided on an “as is” and “as available” basis to the maximum extent permitted by law. We do not guarantee specific business outcomes (for example revenue, staffing, or compliance results).",
      ],
    },
    {
      heading: "Limitation of liability",
      body: [
        "To the extent permitted by law, Rivet’s liability for issues arising from the service should be capped and certain damages excluded—your counsel will set the exact numbers and carve-outs for your entity and region.",
      ],
    },
    {
      heading: "Changes",
      body: [
        "We may update these terms. For material changes, we intend to post a new effective date and, where practical, give reasonable notice by email or in-product message. Details need legal review.",
      ],
    },
    {
      heading: "Contact",
      body: [
        `Questions about these terms: use the contact on the Support page (replace ${SUPPORT_CONTACT_EMAIL_PLACEHOLDER} with your live address).`,
      ],
    },
  ],
} as const

export const privacyPage = {
  title: "Privacy policy",
  metaDescription: "Placeholder privacy policy for Rivet. Legal review and DPIA/data map required before production.",
  sections: [
    {
      heading: "Purpose",
      body: [
        "This policy summarizes—in plain language—what personal information Rivet may process and why. It must be reconciled with your actual product, subprocessors, retention, and regional laws (for example GDPR, PIPEDA, or U.S. state privacy laws).",
      ],
    },
    {
      heading: "What we may collect",
      body: [
        "Account details you provide (such as name and email), workspace and usage data needed to run the product, technical logs (for example IP address, device/browser type) for security and reliability, and payment-related metadata handled by our payment processor—not full card numbers stored by Rivet.",
        "Exact categories and lawful bases require a data map and legal review.",
      ],
    },
    {
      heading: "How we use information",
      body: [
        "To provide and improve Rivet, to secure accounts, to communicate about the service, and to meet legal obligations. We do not sell personal information as a line of business; if that ever changed, this policy would need an update and, where required, consent or opt-out flows.",
      ],
    },
    {
      heading: "Sharing",
      body: [
        "We use infrastructure and service providers (for example hosting, authentication, email, analytics if enabled) under agreements that restrict their use. A current subprocessor list and DPA terms should be published after legal review.",
      ],
    },
    {
      heading: "Retention and security",
      body: [
        "We retain information as long as needed to operate the service and meet legal requirements, then delete or anonymize it according to a schedule your team defines with counsel.",
        "We use reasonable technical and organizational measures to protect data; no method of transmission over the Internet is completely secure.",
      ],
    },
    {
      heading: "Your choices",
      body: [
        "Depending on where you live, you may have rights to access, correct, delete, or export personal information, or to object to certain processing. Describe your process and timelines here after legal review.",
      ],
    },
    {
      heading: "Children",
      body: [
        "Rivet is not directed at children. Do not use it in primary schools or youth programs without appropriate agreements and legal advice.",
      ],
    },
    {
      heading: "Contact",
      body: [
        `Privacy requests: use the contact on the Support page (replace ${SUPPORT_CONTACT_EMAIL_PLACEHOLDER} with your live address).`,
      ],
    },
  ],
} as const

export const refundPolicyPage = {
  title: "Refund policy",
  metaDescription: "Placeholder refund policy for Rivet. Align with payment processor rules and counsel before production.",
  sections: [
    {
      heading: "Digital product",
      body: [
        "Rivet is primarily a digital service. Refund rules often depend on how you paid (for example card network rules, Stripe’s policies, and consumer laws in the buyer’s region). This page is a starting point only.",
      ],
    },
    {
      heading: "General approach (placeholder)",
      body: [
        "We may issue refunds or credits in limited situations—for example duplicate charges or a documented failure to deliver access after successful payment. We do not guarantee a refund in any specific case.",
        "Mandatory rights in your jurisdiction still apply. This policy does not limit those rights.",
      ],
    },
    {
      heading: "How to request",
      body: [
        `Email the address on our Support page (replace ${SUPPORT_CONTACT_EMAIL_PLACEHOLDER} with your live address). Include the email on the account, approximate date of purchase, and a short description of the issue.`,
      ],
    },
    {
      heading: "Chargebacks",
      body: [
        "If you dispute a charge with your bank instead of contacting us first, we may restrict account access while the case is investigated—wording and process need legal and payments review.",
      ],
    },
  ],
} as const

export const supportPage = {
  title: "Support",
  metaDescription: "How to get help with Rivet—contact, scope, and what we do not provide.",
  responseTimeHeading: "Expected response time",
  responseTimeBody:
    "We aim to reply to most messages within two business days. During launches or holidays, replies may take longer. This is a goal, not a service-level agreement—legal review if you need binding SLAs.",
  contactHeading: "Contact",
  contactIntro: "For product help and billing questions, email:",
  contactNote:
    "Replace the placeholder address with your production inbox and update this page before launch. Legal review if you publish SLAs or contractual support obligations elsewhere.",
  includesHeading: "What support includes",
  includes: [
    "Help signing in, linking a workspace, and using documented product features.",
    "Guidance when something looks broken on our side (after you’ve tried a refresh and, if asked, provided a short description and screenshots).",
    "Routing billing questions to the right internal owner when payment is handled by a third party (for example Stripe receipts and checkout emails).",
  ],
  excludesHeading: "What support does not include",
  excludes: [
    "On-site consulting, custom development, or rewriting your operating procedures for you.",
    "Legal, tax, accounting, HR, or regulatory advice—we are not licensed professionals in those fields.",
    "Guaranteed recovery of lost data if copies were not exported by your team (backups and export habits are your responsibility).",
    "24/7 phone support unless you have a separate written agreement that says otherwise.",
  ],
  notSoftwareHeading: "What Rivet is not",
  notSoftwareBody:
    "Rivet is operational workflow and visibility software for your team. It is not payroll software, accounting software, legal practice management, HR information systems, or compliance certification tooling. You remain responsible for meeting obligations that apply to your business, your industry, and your region.",
  footerNote:
    "If you need professional advice (for example employment law or food safety regulations), hire a qualified advisor. Rivet’s materials are for operational clarity only.",
} as const

export const landingFooterLegalLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund-policy", label: "Refunds" },
  { href: "/support", label: "Support" },
] as const
