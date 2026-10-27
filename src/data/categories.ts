import type { CategorySlug } from "@/types/domain";

export interface CategoryInfo {
  slug: CategorySlug;
  name: string;
  intro: string;
  faqs: { question: string; answer: string }[];
}

export const categories: CategoryInfo[] = [
  {
    slug: "facebook-crm",
    name: "Facebook & CRM",
    intro:
      "Facebook & CRM workflows turn Messenger conversations and Page activity into a structured pipeline instead of a scattered inbox. Each template listens for a Messenger message or a Page comment, uses AI to pull out intent, budget, and contact details, and writes a clean, de-duplicated row to Google Sheets or Airtable so nothing gets lost between shifts. Most also send an instant reply within Meta's 24-hour messaging window, so leads hear back before they go looking elsewhere. If your team currently copies Messenger conversations into a spreadsheet by hand, this is the category to start with — setup takes 25–45 minutes and every template ships with the exact Meta permissions you'll need to request.",
    faqs: [
      {
        question: "Do these workflows need Meta App Review?",
        answer: "Production use of pages_messaging typically requires Meta App Review — each workflow's page lists the exact permissions needed so you can start that process early.",
      },
      {
        question: "Can I use these without an existing CRM?",
        answer: "Yes — every template in this category writes to Google Sheets or Airtable directly, so you don't need a separate CRM tool to get started.",
      },
      {
        question: "What if I get more comments/messages than expected?",
        answer: "Each workflow includes rate-limit guards and an error handler, so a traffic spike gets queued and logged rather than dropped.",
      },
    ],
  },
  {
    slug: "lead-generation",
    name: "Lead Generation",
    intro:
      "Lead Generation workflows do the research and first-pass qualification that usually eats a founder's morning: searching for businesses that match your ideal customer profile, enriching website form submissions with AI-scored urgency, and logging everything to a sheet your sales team can work from immediately. None of these scrape social profiles — they use official APIs (Google Places) or your own form submissions as the data source, so you stay within each platform's terms of service. If you're currently building prospect lists by hand or letting form submissions sit in an inbox overnight, these templates get you a working pipeline in under 40 minutes.",
    faqs: [
      {
        question: "Is this compliant with LinkedIn/Instagram scraping rules?",
        answer: "These workflows don't scrape any social platform — they use the official Google Places API or your own form submissions only.",
      },
      {
        question: "Does the Google Places API cost extra?",
        answer: "Yes, Google bills API usage on your own Google Cloud project separately from the one-time workflow price.",
      },
      {
        question: "Can I connect my own form tool?",
        answer: "Yes — the webhook-based templates work with any form tool that can POST JSON, including Typeform, Tally, and custom HTML forms.",
      },
    ],
  },
  {
    slug: "social-media",
    name: "Social Media",
    intro:
      "Social Media workflows take one piece of content — a blog post or an RSS item — and turn it into channel-ready posts for LinkedIn, X, Facebook, and Telegram, using AI to adapt tone and length per platform rather than just copy-pasting the same text everywhere. One template publishes directly; another routes every AI draft through a Google Sheets approval queue first, with a Slack ping when something's ready for your sign-off. Both save the hour or more it normally takes to manually reformat one post into four different platform-native versions.",
    faqs: [
      {
        question: "Do these post automatically without review?",
        answer: "The direct distributor publishes immediately; the RSS-based template holds every draft in an approval queue until you mark it Approved.",
      },
      {
        question: "Can I use only some of the channels?",
        answer: "Yes — disable the publish node for any channel you don't use; the rest of the workflow keeps working.",
      },
      {
        question: "Does it carry over images?",
        answer: "Yes, where the target platform's API supports it — featured images are carried through to LinkedIn and Facebook Page posts.",
      },
    ],
  },
  {
    slug: "e-commerce",
    name: "E-Commerce",
    intro:
      "E-Commerce workflows connect directly to Shopify's webhooks to keep your team ahead of orders, stock levels, and abandoned carts without anyone refreshing the admin dashboard. Order alerts land in Telegram the moment they're paid, a fulfilment tracker updates itself in Google Sheets, low-stock items get flagged with an AI-drafted supplier reorder email waiting in your Gmail drafts, and abandoned checkouts get a timed, opt-in recovery sequence across Messenger and email. Every template reads live from your store — nothing here is a scheduled export or a manual CSV upload.",
    faqs: [
      {
        question: "Do these work with multiple Shopify locations?",
        answer: "Yes — location data comes through in the standard order and inventory payloads and can be broken out in the sheet if you need it.",
      },
      {
        question: "Does the cart recovery workflow message everyone?",
        answer: "No — the Messenger touch only goes to customers with an existing opt-in on file; otherwise only the email follow-up runs.",
      },
      {
        question: "Are reorder emails sent automatically?",
        answer: "No — the low-stock workflow creates a Gmail draft only, so a person reviews quantities and pricing before it's sent.",
      },
    ],
  },
  {
    slug: "ai-llm",
    name: "AI & LLM",
    intro:
      "AI & LLM workflows use a language model as a genuine processing step — classifying support tickets by priority, answering customer questions from your own Google Sheets FAQ, or matching Messenger replies to a scoped sales script — rather than bolting AI onto an otherwise manual process. Every template includes a fixed system prompt that keeps the model on-topic, a fallback path for anything it can't confidently handle, and a log of unanswered questions so you can see exactly where the FAQ or training data needs work. Nothing here trains on your data or shares it beyond the single API call needed to process each request.",
    faqs: [
      {
        question: "Can the AI go off-script or hallucinate an answer?",
        answer: "Each workflow's system prompt restricts it to your own data (an FAQ sheet, a product catalog) and includes an explicit fallback for anything outside that scope.",
      },
      {
        question: "Is my data used to train AI models?",
        answer: "No — inputs are sent only for the single completion needed to process that request; FlowSaaS does not use customer data to train models.",
      },
      {
        question: "What if the AI is uncertain?",
        answer: "Uncertain or low-confidence cases are routed to a fallback message or an escalation alert rather than guessing, and logged so you can review them.",
      },
    ],
  },
];

export function getCategory(slug: string): CategoryInfo | undefined {
  return categories.find((c) => c.slug === slug);
}
