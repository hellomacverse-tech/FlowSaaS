export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  clientName: string;
  industry: string;
  challenge: string;
  solution: string;
  results: string[];
  verified: boolean;
  isSeed: boolean;
}

export const caseStudies: CaseStudy[] = [
  {
    id: "cs1",
    slug: "oasis-home-decor-messenger-crm",
    title: "Oasis Home Décor — Messenger to Sheets CRM",
    clientName: "Oasis Home Décor",
    industry: "Home & Décor Retail",
    challenge: "Leads scattered across Messenger threads and evening manual entry.",
    solution:
      "Facebook Messenger CRM Lead Capture & Google Sheets Sync + comment-to-Messenger replies.",
    results: ["15 hrs/week saved", "Lead response time 2 hrs → 40 sec", "+27% qualified leads"],
    verified: false,
    isSeed: true,
  },
  {
    id: "cs2",
    slug: "kite-logistics-dfy-rollout",
    title: "Kite & Co. Logistics — DFY multi-workflow rollout",
    clientName: "Kite & Co. Logistics",
    industry: "Logistics",
    challenge: "Ops team drowning in status updates.",
    solution: "Four DFY workflows on the client's own VPS with security testing.",
    results: ["31 hrs/week saved", "0 failed runs in first 30 days", "Payback in 3 weeks"],
    verified: false,
    isSeed: true,
  },
  {
    id: "cs3",
    slug: "brightline-apps-content-distribution",
    title: "Brightline Apps — Content distribution",
    clientName: "Brightline Apps",
    industry: "Software",
    challenge: "One post, six manual reposts.",
    solution: "Multi-Channel Content Distributor with AI-adapted captions.",
    results: ["10 hrs/week saved", "6 channels, 1 click", "+44% posting consistency"],
    verified: false,
    isSeed: true,
  },
];
