import type { Faq } from "@/types/domain";

/**
 * Home FAQ content (Section 9.1.8), kept in lockstep with
 * supabase/seed/faqs.json — this is the copy actually rendered on the
 * page (and matched 1:1 by the FAQPage JSON-LD), while the seed file is
 * what a live Supabase project gets loaded with once Phase 3+ wires the
 * page up to read from the database instead of this static array.
 */
export const homeFaqs: Faq[] = [
  {
    id: "home-faq-1",
    question: "What is an n8n workflow template?",
    answerMd: "An n8n workflow template is a pre-built automation saved as a JSON file. It contains the trigger, logic, and app connections (called nodes) needed to perform a task—such as capturing a Facebook Messenger lead and saving it to Google Sheets—without building it from scratch. You import the file into n8n, connect your own accounts, and switch it on. Every FlowSaaS template ships with documentation, a setup video, and a list of the credentials it needs.",
    answerPlain: "An n8n workflow template is a pre-built automation saved as a JSON file. It contains the trigger, logic, and app connections (called nodes) needed to perform a task—such as capturing a Facebook Messenger lead and saving it to Google Sheets—without building it from scratch. You import the file into n8n, connect your own accounts, and switch it on. Every FlowSaaS template ships with documentation, a setup video, and a list of the credentials it needs.",
  },
  {
    id: "home-faq-2",
    question: "How do I import the JSON file to my n8n instance?",
    answerMd: "Open your n8n editor, create a new workflow, click the menu in the top-right, and choose Import from File (or paste the JSON directly on the canvas). Then open each node showing a warning icon, select or create the credential it needs, and click Execute Workflow to test. Finally, toggle Active. If you're on a paid plan you can skip all of this: connect your instance in the FlowSaaS dashboard and use Deploy to My n8n Instance to push the workflow in one click. Our step-by-step video for each workflow covers this in under 10 minutes.",
    answerPlain: "Open your n8n editor, create a new workflow, click the menu in the top-right, and choose Import from File (or paste the JSON directly on the canvas). Then open each node showing a warning icon, select or create the credential it needs, and click Execute Workflow to test. Finally, toggle Active. If you're on a paid plan you can skip all of this: connect your instance in the FlowSaaS dashboard and use Deploy to My n8n Instance to push the workflow in one click. Our step-by-step video for each workflow covers this in under 10 minutes.",
  },
  {
    id: "home-faq-3",
    question: "Do I need technical coding skills to use FlowSaaS?",
    answerMd: "No. Templates are built so that setup is point-and-click: import, connect accounts, activate. Our Micro-SaaS Tools go further — you fill in a simple form in your browser and the automation runs on our servers, with no n8n installation at all. If you'd rather not touch any of it, our Done-For-You team deploys and tests everything for you. Basic comfort with copying API keys is helpful for self-installed templates, and every guide explains where to find them.",
    answerPlain: "No. Templates are built so that setup is point-and-click: import, connect accounts, activate. Our Micro-SaaS Tools go further — you fill in a simple form in your browser and the automation runs on our servers, with no n8n installation at all. If you'd rather not touch any of it, our Done-For-You team deploys and tests everything for you. Basic comfort with copying API keys is helpful for self-installed templates, and every guide explains where to find them.",
  },
  {
    id: "home-faq-4",
    question: "What if I need a custom enterprise workflow?",
    answerMd: "Book a Discovery & Architecture Call. We'll map your process, propose an architecture, and quote a fixed-scope build. Custom workflows are engineered by our team, security-tested, deployed to your infrastructure (cloud or on-premise), and handed over with training and 30 days of support. Enterprise plans add SSO, a private workflow library, an uptime SLA, and a dedicated support channel.",
    answerPlain: "Book a Discovery & Architecture Call. We'll map your process, propose an architecture, and quote a fixed-scope build. Custom workflows are engineered by our team, security-tested, deployed to your infrastructure (cloud or on-premise), and handed over with training and 30 days of support. Enterprise plans add SSO, a private workflow library, an uptime SLA, and a dedicated support channel.",
  },
  {
    id: "home-faq-5",
    question: "Can I use the workflows on n8n Cloud and self-hosted n8n?",
    answerMd: "Yes. Each workflow lists its minimum n8n version and any community nodes it needs. Workflows using only core nodes work on both n8n Cloud and self-hosted n8n. Community nodes require self-hosting or an n8n plan that allows them; this is flagged on the product page before you buy.",
    answerPlain: "Yes. Each workflow lists its minimum n8n version and any community nodes it needs. Workflows using only core nodes work on both n8n Cloud and self-hosted n8n. Community nodes require self-hosting or an n8n plan that allows them; this is flagged on the product page before you buy.",
  },
  {
    id: "home-faq-6",
    question: "What happens if a workflow breaks after an app changes its API?",
    answerMd: "We monitor supported workflows, patch them, and publish a new version with a changelog. VIP members receive updates automatically in their library; one-time buyers get updates for 12 months. DFY clients are covered by their 30-day support window, plus optional maintenance plans.",
    answerPlain: "We monitor supported workflows, patch them, and publish a new version with a changelog. VIP members receive updates automatically in their library; one-time buyers get updates for 12 months. DFY clients are covered by their 30-day support window, plus optional maintenance plans.",
  },
  {
    id: "home-faq-7",
    question: "Are the Facebook Messenger automations compliant with Meta's rules?",
    answerMd: "Our Messenger workflows are built around Meta's Platform Terms, including the standard 24-hour messaging window and opt-in requirements. You remain responsible for having user consent and for using approved message tags where relevant. Each workflow's documentation lists the exact permissions and App Review requirements.",
    answerPlain: "Our Messenger workflows are built around Meta's Platform Terms, including the standard 24-hour messaging window and opt-in requirements. You remain responsible for having user consent and for using approved message tags where relevant. Each workflow's documentation lists the exact permissions and App Review requirements.",
  },
  {
    id: "home-faq-8",
    question: "What is your refund policy?",
    answerMd: "One-time template purchases can be refunded within 14 days if the workflow doesn't work as documented and our support team can't resolve it. VIP subscriptions can be cancelled at any time and remain active until the end of the billing period. DFY projects follow the milestone terms in your agreement.",
    answerPlain: "One-time template purchases can be refunded within 14 days if the workflow doesn't work as documented and our support team can't resolve it. VIP subscriptions can be cancelled at any time and remain active until the end of the billing period. DFY projects follow the milestone terms in your agreement.",
  },
];
