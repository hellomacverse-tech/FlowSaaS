export interface Testimonial {
  id: string;
  authorName: string;
  authorRole: string;
  company: string;
  quote: string;
  metricValue: string;
  /** Only `verified` testimonials render in production (Section 9.1.7). */
  verified: boolean;
  isSeed: boolean;
}

/**
 * All six launch testimonials are seed content (`isSeed: true, verified:
 * false`) — real, permissioned quotes replace these before launch. The
 * `<Proof />` section only renders seed items when
 * `NEXT_PUBLIC_SHOW_SEED_CONTENT=true`, with a visible "SAMPLE" ribbon
 * (Section 16, rule 1c).
 */
export const testimonials: Testimonial[] = [
  {
    id: "t1",
    authorName: "Layla Hassan",
    authorRole: "Founder",
    company: "Oasis Home Décor",
    quote:
      "We were copy-pasting Messenger leads into a spreadsheet every evening. Now they land in Sheets with intent and budget already tagged, and my team just follows up.",
    metricValue: "−15 hrs/week",
    verified: false,
    isSeed: true,
  },
  {
    id: "t2",
    authorName: "Marcus Webb",
    authorRole: "Operations Lead",
    company: "Northbeam Studio",
    quote: "The setup video was so precise I imported the JSON and had it live before my coffee got cold.",
    metricValue: "Live in 22 min",
    verified: false,
    isSeed: true,
  },
  {
    id: "t3",
    authorName: "Priya Nair",
    authorRole: "COO",
    company: "Kite & Co. Logistics",
    quote:
      "Their DFY team hardened our n8n server, deployed four workflows, and trained my staff in one week. Nothing has failed since.",
    metricValue: "0 failed runs / 30 days",
    verified: false,
    isSeed: true,
  },
  {
    id: "t4",
    authorName: "Tomás Rivera",
    authorRole: "Head of Growth",
    company: "Brightline Apps",
    quote:
      "Caption Distributor turned one blog post into six channel-ready posts. It's the first automation my marketing team actually uses daily.",
    metricValue: "−10 hrs/week",
    verified: false,
    isSeed: true,
  },
  {
    id: "t5",
    authorName: "Sara Al-Mansoori",
    authorRole: "Owner",
    company: "Nakheel Threads",
    quote: "Order alerts in Telegram and a live fulfilment sheet — my two-person shop finally feels organised.",
    metricValue: "−7 hrs/week",
    verified: false,
    isSeed: true,
  },
  {
    id: "t6",
    authorName: "Daniel Okafor",
    authorRole: "CTO",
    company: "Meridian Health Ops",
    quote:
      "We passed our client's security questionnaire because FlowSaaS gave us encrypted credentials handling and full audit logs.",
    metricValue: "Security review passed",
    verified: false,
    isSeed: true,
  },
];
