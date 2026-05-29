/**
 * Production legal and support copy for Rivet.
 * Contact and operator name: `@/lib/site-legal-config` (env-overridable).
 */

import {
  FOUNDER_LIFETIME_PRICING,
  FOUNDER_LIFETIME_PROMISES,
} from "@/lib/billing/founder-offer"
import type { LegalSection } from "@/lib/legal-section"
import { LEGAL_EFFECTIVE_DATE, LEGAL_OPERATOR_NAME, SUPPORT_EMAIL } from "@/lib/site-legal-config"

const founderOnce = FOUNDER_LIFETIME_PRICING.onceDisplay
const founderInstallment = FOUNDER_LIFETIME_PRICING.installmentDisplay
const founderTotalInstallment = `$${FOUNDER_LIFETIME_PRICING.installmentCount * (FOUNDER_LIFETIME_PRICING.installmentAmountCents / 100)} CAD total (${FOUNDER_LIFETIME_PRICING.installmentTotalDisplay})`

export const termsPage = {
  title: "Terms of Service",
  metaDescription:
    "Terms governing use of Rivet operational software, Founder Lifetime Access, workspaces, and customer content.",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  sections: [
    {
      heading: "Agreement",
      body: [
        `These Terms of Service ("Terms") are a binding agreement between you and ${LEGAL_OPERATOR_NAME} ("Rivet," "we," "us") for access to the Rivet websites, applications, and related services (collectively, the "Service").`,
        `By creating an account, completing checkout, or using the Service after ${LEGAL_EFFECTIVE_DATE}, you agree to these Terms. If you use the Service on behalf of a company, you represent that you have authority to bind that company.`,
      ],
    },
    {
      heading: "The Service",
      body: [
        "Rivet is cloud software that helps businesses document and run operational workflows—including plays (standards), training, team visibility, Ask Rivet Q&A, owner-interruption tracking, and related features described on our site.",
        "We may add, change, or remove features. We do not guarantee uninterrupted or error-free operation. We may suspend access for maintenance, security, abuse, or legal compliance.",
      ],
    },
    {
      heading: "Accounts and workspaces",
      body: [
        "You must provide accurate registration information and keep credentials secure. You are responsible for activity under your account and for who you invite to a workspace.",
        "A workspace is tied to a business you operate or administer. You control roles (for example owner, manager, trainer, staff) and the content your team enters.",
      ],
    },
    {
      heading: "Your content",
      body: [
        'You retain ownership of content you and your team upload or enter (text, media, procedures, training materials, and similar data) ("Customer Content").',
        "You grant Rivet a worldwide, non-exclusive license to host, store, process, transmit, display, and back up Customer Content solely to provide and improve the Service, comply with law, and enforce these Terms. This license ends when Customer Content is deleted from our systems, subject to reasonable backup retention.",
        "You are responsible for having all rights needed for Customer Content and for complying with laws that apply to your business (including privacy, employment, and industry-specific rules).",
      ],
    },
    {
      heading: "Acceptable use",
      list: [
        "Do not use the Service to break the law, infringe others' rights, or distribute malware.",
        "Do not attempt to access another customer's workspace or data without authorization.",
        "Do not reverse engineer, scrape, or overload the Service except as permitted by law.",
        "Do not resell or sublicense the Service without our written permission.",
      ],
    },
    {
      heading: "Founder Lifetime Access and fees",
      body: [
        `We currently offer Founder Lifetime Access for eligible workspaces: ${founderOnce}, or ${founderInstallment} (${founderTotalInstallment}), plus applicable taxes. Payment is processed by Stripe. Prices and payment options shown at checkout are part of your order.`,
        `Founder Lifetime Access includes: ${FOUNDER_LIFETIME_PROMISES.join("; ")}. Workspaces that complete a qualifying founder purchase are grandfathered on that workspace as described at checkout and in our Refund Policy.`,
        "We may introduce subscription plans in the future. Founder-grandfathered workspaces keep Rivet Core access on that workspace without a recurring subscription for Rivet Core, as stated at purchase.",
        "Except where required by law, fees are non-refundable outside our Refund Policy. You authorize Stripe to charge the payment method you provide.",
      ],
    },
    {
      heading: "Third-party services",
      body: [
        "The Service relies on providers such as hosting, authentication, email delivery, analytics (if enabled), and payment processing (Stripe). Their terms and privacy practices apply to their handling of data they process on our behalf.",
        "Optional AI-assisted features, when enabled, may send content you submit to model providers under our Privacy Policy.",
      ],
    },
    {
      heading: "Disclaimer",
      body: [
        'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, RIVET DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
        "Rivet does not provide legal, HR, accounting, food-safety, or regulatory advice. Outputs and scores (including scan or readiness estimates) are directional tools only—not guarantees of compliance, revenue, or operational outcomes.",
      ],
    },
    {
      heading: "Limitation of liability",
      body: [
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, RIVET AND ITS SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, DATA, OR GOODWILL.",
        "OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THE SERVICE OR THESE TERMS IS LIMITED TO THE GREATER OF (A) THE AMOUNTS YOU PAID TO RIVET FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED CANADIAN DOLLARS (CAD $100).",
        "Some jurisdictions do not allow certain limitations; in those cases, our liability is limited to the fullest extent permitted by law.",
      ],
    },
    {
      heading: "Indemnity",
      body: [
        "You will defend and indemnify Rivet against claims arising from your Customer Content, your use of the Service, or your violation of these Terms, except to the extent caused by Rivet's gross negligence or willful misconduct.",
      ],
    },
    {
      heading: "Termination",
      body: [
        "You may stop using the Service at any time. We may suspend or terminate access if you materially breach these Terms, create risk for us or other users, or where required by law.",
        "Upon termination, your right to use the Service ends. We may delete or retain Customer Content as described in our Privacy Policy and applicable law.",
      ],
    },
    {
      heading: "Changes",
      body: [
        "We may update these Terms. We will post the new effective date on this page and, for material changes, provide notice by email or in-product message when practical. Continued use after the effective date constitutes acceptance.",
      ],
    },
    {
      heading: "Governing law",
      body: [
        "These Terms are governed by the laws of Canada and the Province of Ontario, without regard to conflict-of-law rules. Courts in Ontario will have exclusive jurisdiction, except that either party may seek injunctive relief in any competent court.",
        "If you are a consumer with mandatory protections in your province or country, those protections remain available to you.",
      ],
    },
    {
      heading: "Contact",
      body: [
        `Questions about these Terms: ${SUPPORT_EMAIL} or our Support page at /support.`,
      ],
    },
  ] satisfies readonly LegalSection[],
} as const

export const privacyPage = {
  title: "Privacy Policy",
  metaDescription:
    "How Rivet collects, uses, and protects personal information for accounts, workspaces, billing, and scan reports.",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  sections: [
    {
      heading: "Who we are",
      body: [
        `${LEGAL_OPERATOR_NAME} ("Rivet") operates the Rivet Service. This Privacy Policy explains how we handle personal information when you visit our site, create an account, use a workspace, purchase access, or submit a Rivet Scan.`,
        `Effective ${LEGAL_EFFECTIVE_DATE}.`,
      ],
    },
    {
      heading: "Information we collect",
      list: [
        "Account data: name, email, authentication identifiers, and profile settings you provide.",
        "Workspace data: business name, team membership, roles, and operational content you and your team enter (plays, training, media, interruptions, Ask Rivet questions, and related records).",
        "Billing data: purchase status, Stripe customer and payment identifiers, and transaction metadata. Full payment card numbers are processed by Stripe; we do not store them.",
        "Scan and marketing leads: contact details and answers you submit on the Rivet Scan, plus generated reports we email to you.",
        "Technical data: IP address, browser/device type, logs, cookies, and similar data used for security, debugging, and performance.",
        "Communications: messages you send to support and our replies.",
      ],
    },
    {
      heading: "How we use information",
      list: [
        "Provide, secure, and improve the Service.",
        "Process payments and confirm Founder Lifetime Access for your workspace.",
        "Send transactional messages (receipts, access, password resets, scan reports).",
        "Respond to support requests and protect against abuse or fraud.",
        "Comply with law and enforce our Terms.",
        "With your consent or direction, where required (for example optional marketing, if offered).",
      ],
    },
    {
      heading: "Legal bases (where applicable)",
      body: [
        "If you are in Canada, we rely on consent, contractual necessity, and legitimate interests as appropriate under PIPEDA and provincial privacy laws.",
        "If you are in the EEA/UK, we process data based on contract performance, legitimate interests (security, product improvement), legal obligation, or consent where required.",
      ],
    },
    {
      heading: "Sharing",
      body: [
        "We share personal information with service providers that help us run Rivet, under contracts that limit their use to our instructions:",
      ],
      list: [
        "Supabase (database, authentication, file storage)",
        "Stripe (payments)",
        "Resend (transactional email, including scan reports)",
        "Hosting and infrastructure providers that serve our application",
        "OpenAI or similar providers, only when you use AI-assisted features that send content for processing",
      ],
    },
    {
      heading: "International transfers",
      body: [
        "Our providers may process data in Canada, the United States, or other countries. We use appropriate safeguards where required by law for cross-border transfers.",
      ],
    },
    {
      heading: "Retention",
      body: [
        "We keep personal information while your account or workspace is active and for a reasonable period afterward for backups, legal compliance, and dispute resolution.",
        "You may request deletion subject to exceptions (for example billing records we must retain).",
      ],
    },
    {
      heading: "Security",
      body: [
        "We use technical and organizational measures such as encryption in transit, access controls, and workspace isolation. No method of transmission or storage is completely secure.",
      ],
    },
    {
      heading: "Your rights and choices",
      list: [
        "Access, correct, or delete personal information we hold about you, subject to legal exceptions.",
        "Withdraw consent where processing is consent-based (without affecting prior lawful processing).",
        "Opt out of marketing emails using the unsubscribe link, if we send them.",
        "Lodge a complaint with your privacy regulator (for example the Office of the Privacy Commissioner of Canada).",
      ],
    },
    {
      heading: "Children",
      body: [
        "The Service is for businesses and is not directed to children under 16. We do not knowingly collect children's personal information.",
      ],
    },
    {
      heading: "Changes",
      body: [
        "We may update this policy. We will post the new effective date here and provide additional notice for material changes when appropriate.",
      ],
    },
    {
      heading: "Contact",
      body: [
        `Privacy requests and questions: ${SUPPORT_EMAIL}. Include "Privacy" in the subject line and the email on your account.`,
      ],
    },
  ] satisfies readonly LegalSection[],
} as const

export const refundPolicyPage = {
  title: "Refund Policy",
  metaDescription:
    "Refund and billing terms for Rivet Founder Lifetime Access, including the 14-day satisfaction window and how to request help.",
  effectiveDate: LEGAL_EFFECTIVE_DATE,
  sections: [
    {
      heading: "Scope",
      body: [
        "This Refund Policy applies to Founder Lifetime Access and other paid Rivet purchases made through our checkout (processed by Stripe). It supplements our Terms of Service.",
        "Mandatory consumer rights in your province or country are not limited by this policy.",
      ],
    },
    {
      heading: "Founder Lifetime Access",
      body: [
        `Founder Lifetime Access is a one-time purchase for lifetime Rivet Core on a single workspace: ${founderOnce}, or ${founderInstallment} (${founderTotalInstallment}).`,
        `Your purchase includes: ${FOUNDER_LIFETIME_PROMISES.join("; ")}. Grandfathering applies to the workspace identified at checkout after payment is confirmed.`,
      ],
    },
    {
      heading: "14-day satisfaction refund",
      body: [
        "If you are unsatisfied with Rivet, you may request a full refund within fourteen (14) days of your first successful Founder Lifetime payment for that workspace, provided you have not extensively used the Service (for example large volumes of plays, team invites, or training modules beyond reasonable evaluation).",
        "We may decline refunds where we detect abuse, repeated refund requests, or chargeback fraud.",
        "Installment plans: if you chose three payments, the 14-day window starts on the first successful installment. Refunding the first payment cancels remaining installments when technically possible through Stripe.",
      ],
    },
    {
      heading: "When refunds are not available",
      list: [
        "Requests made after the 14-day satisfaction window (except where law requires otherwise).",
        "Duplicate or mistaken charges we cannot verify.",
        "Dissatisfaction with business outcomes (Rivet does not guarantee operational or financial results).",
        "Access revoked for Terms violations or abuse.",
      ],
    },
    {
      heading: "How to request a refund",
      body: [
        `Email ${SUPPORT_EMAIL} from the address on your Rivet account. Include your workspace name, the purchase date, and whether you paid once or in installments. We typically respond within two business days.`,
        "Approved refunds are returned to the original payment method through Stripe. Processing times depend on your bank (often 5–10 business days).",
      ],
    },
    {
      heading: "Receipts and billing help",
      body: [
        "Stripe sends payment receipts to the email entered at checkout. For billing questions before requesting a refund, contact us at the address above with your receipt or the last four digits of your card.",
        "See our Support page for Founder pricing details and workspace access after payment.",
      ],
    },
    {
      heading: "Chargebacks",
      body: [
        "Contact us before filing a chargeback so we can resolve the issue quickly. Unfounded chargebacks may result in suspension of workspace access while the dispute is investigated.",
      ],
    },
  ] satisfies readonly LegalSection[],
} as const

export const supportPage = {
  title: "Support",
  metaDescription:
    "Contact Rivet support for product help, Founder Lifetime billing, receipts, and workspace access.",
  responseTimeHeading: "Response time",
  responseTimeBody:
    "We reply to most messages within two business days (Monday–Friday, excluding Canadian public holidays). Urgent billing issues that block access are prioritized when you mark the subject line “Billing — blocked access.”",
  contactHeading: "Contact us",
  contactIntro: "For product help, billing, privacy, and refund requests:",
  billingHeading: "Billing and Founder Lifetime Access",
  billingIntro:
    "Payments are processed securely by Stripe. Your workspace unlocks when Stripe confirms payment and our system records a paid purchase.",
  founderProductName: "Founder Lifetime Access",
  founderPricingLines: [
    `${founderOnce} — one payment, lifetime Rivet Core on your workspace.`,
    `${founderInstallment} — three equal payments (${founderTotalInstallment}); same lifetime access and grandfathering when all installments complete.`,
  ] as const,
  founderIncludes: [...FOUNDER_LIFETIME_PROMISES] as const,
  founderGrandfatherNote:
    "Founder workspaces are permanently grandfathered on the workspace you paid for: Rivet Core, future core updates, and no recurring subscription for Rivet Core—even if we introduce paid subscription tiers later. Grandfathering does not transfer to a different workspace.",
  billingHelpList: [
    "Receipts: check the email you used at Stripe Checkout; search for “Stripe” or “Rivet.”",
    "Wrong workspace: contact us before checkout if you operate multiple businesses—we link purchase to the workspace on your profile at checkout.",
    "Access not unlocked after payment: email us with your account email and approximate payment time; we will verify the purchase and fix access.",
    "Refunds: see our Refund Policy for the 14-day satisfaction window and how to request one.",
    "Installments: all three payments must succeed for full grandfathering; failed installments may pause access until resolved.",
  ] as const,
  includesHeading: "What support includes",
  includes: [
    "Signing in, linking a workspace, and using documented Rivet features.",
    "Troubleshooting errors that appear to originate on our side (with steps to reproduce when possible).",
    "Billing verification, Stripe receipt questions, and founder access issues.",
    "Rivet Scan report delivery (missing email, resend limits, or broken report links).",
  ],
  excludesHeading: "What support does not include",
  excludes: [
    "Writing or certifying your operating procedures, HR policies, or regulatory programs.",
    "Legal, tax, accounting, or employment advice.",
    "On-site consulting, custom development, or data recovery when your team has not exported backups.",
    "24/7 phone support (email only unless you have a separate written agreement).",
  ],
  notSoftwareHeading: "What Rivet is not",
  notSoftwareBody:
    "Rivet is operational workflow software for your team. It is not payroll, accounting, legal practice management, or government compliance certification. You remain responsible for obligations that apply to your business.",
  relatedLinks: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/refund-policy", label: "Refund Policy" },
    { href: "/subscribe", label: "Founder checkout" },
  ] as const,
} as const

export const landingFooterLegalLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund-policy", label: "Refunds" },
  { href: "/support", label: "Support" },
] as const
