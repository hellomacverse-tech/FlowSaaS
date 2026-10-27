import type { WorkflowDetail, WorkflowGraph } from "@/types/domain";
import { catalogSeed } from "./catalog-seed";
import { requirementsForIntegrations } from "./integration-requirements";
import { buildSequentialGraph, type NodeDocInput } from "@/lib/workflow-graph";

type DetailContent = {
  subtitle: string;
  descriptionMd: string;
  n8nMinVersion: string;
  nodes: NodeDocInput[];
  howToSteps: WorkflowDetail["howToSteps"];
  faqs: WorkflowDetail["faqs"];
};

const content: Record<string, DetailContent> = {
  "facebook-messenger-crm-google-sheets": {
    subtitle:
      "Every Messenger conversation becomes a scored, de-duplicated lead row in Google Sheets — with an instant reply and a team alert.",
    descriptionMd:
      "**The problem:** Leads arrive in Messenger at all hours; copying them into a sheet is slow, inconsistent, and often forgotten.\n\n**The solution:** This workflow listens to your Facebook Page via webhook, verifies each event, uses AI to extract name, contact, intent, and budget, scores the lead, de-duplicates by PSID, writes to Google Sheets, replies within Meta's 24-hour window, and alerts your team on Telegram.",
    n8nMinVersion: "1.60.0",
    nodes: [
      { name: "Messenger Webhook", type: "Webhook", purpose: "Receives Meta events and the GET verification challenge.", credentialsNeeded: null, notes: "", group: "trigger" },
      { name: "Verify Signature", type: "Code", purpose: "Validates X-Hub-Signature-256 with your app secret.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Filter Message Events", type: "IF", purpose: "Passes only user text messages.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Get User Profile", type: "HTTP Request", purpose: "Fetches first/last name from the Graph API.", credentialsNeeded: "Facebook Page access token", notes: "", group: "data" },
      { name: "Extract Intent & Fields", type: "OpenAI", purpose: "Returns JSON {intent, budget, phone, email, language}.", credentialsNeeded: "OpenAI API key", notes: "", group: "ai" },
      { name: "Score Lead", type: "Code", purpose: "0–100 score from intent + budget + contact completeness.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Find Existing Lead", type: "Google Sheets", purpose: "Looks up the row by PSID.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "data" },
      { name: "Upsert Lead Row", type: "Google Sheets", purpose: "Appends or updates the lead row.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "data" },
      { name: "Send Reply", type: "HTTP Request", purpose: "Sends a templated reply by intent, within the 24-hour window.", credentialsNeeded: "Facebook Page access token", notes: "Send API only — respects Meta's messaging window.", group: "output" },
      { name: "Notify Team", type: "Telegram", purpose: "Alerts the team for hot leads (score ≥ 70).", credentialsNeeded: "Telegram bot token", notes: "", group: "output" },
      { name: "Error Handler", type: "Error Trigger", purpose: "Logs failures to an Errors sheet.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "logic" },
    ],
    howToSteps: [
      { step: 1, name: "Import the JSON into n8n", text: "In n8n, create a new workflow, open the menu, choose Import from File and select the FlowSaaS JSON." },
      { step: 2, name: "Create the Google Sheet", text: "Create the Google Sheet using the provided column template." },
      { step: 3, name: "Connect credentials", text: "Connect your Google Sheets and OpenAI credentials." },
      { step: 4, name: "Create your Meta app", text: "Create your Meta app and subscribe the Page to the messages webhook." },
      { step: 5, name: "Add tokens and test", text: "Paste your Page Access Token and App Secret, then run a test message." },
      { step: 6, name: "Activate and verify", text: "Activate the workflow and verify the first lead row." },
    ],
    faqs: [
      { id: "f1", question: "Does this work with n8n Cloud?", answerMd: "Yes. It uses only core nodes and works on n8n Cloud and self-hosted n8n.", answerPlain: "Yes. It uses only core nodes and works on n8n Cloud and self-hosted n8n." },
      { id: "f2", question: "Is this compliant with Meta's Messenger rules?", answerMd: "It uses the Send API within Meta's 24-hour standard messaging window. You are responsible for user consent and Meta App Review.", answerPlain: "It uses the Send API within Meta's 24-hour standard messaging window. You are responsible for user consent and Meta App Review." },
      { id: "f3", question: "What columns does the Google Sheet need?", answerMd: "Timestamp, PSID, Name, Intent, Budget, Phone, Email, Score, Status, Last Message, Language — the setup video covers creating this from the template.", answerPlain: "Timestamp, PSID, Name, Intent, Budget, Phone, Email, Score, Status, Last Message, Language — the setup video covers creating this from the template." },
      { id: "f4", question: "What happens to leads under score 70?", answerMd: "They're still logged to the sheet and replied to — only the Telegram team alert is reserved for scores of 70 and above, to avoid alert fatigue.", answerPlain: "They're still logged to the sheet and replied to — only the Telegram team alert is reserved for scores of 70 and above, to avoid alert fatigue." },
    ],
  },

  "messenger-ai-sales-agent-orders": {
    subtitle: "An AI sales agent chats with Messenger leads, answers product questions, and captures orders into Airtable.",
    descriptionMd:
      "**The problem:** A human has to be online to answer product questions and take orders in Messenger, or leads go cold overnight.\n\n**The solution:** This workflow runs a scoped AI sales agent that answers questions from your product catalog, handles objections with a fixed set of approved responses, and — once a customer confirms — captures a structured order into Airtable and notifies your team.",
    n8nMinVersion: "1.60.0",
    nodes: [
      { name: "Messenger Webhook", type: "Webhook", purpose: "Receives Messenger events.", credentialsNeeded: null, notes: "", group: "trigger" },
      { name: "Verify Signature", type: "Code", purpose: "Validates the Meta webhook signature.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Load Conversation State", type: "Airtable", purpose: "Fetches this PSID's conversation so far.", credentialsNeeded: "Airtable personal access token", notes: "", group: "data" },
      { name: "Load Product Catalog", type: "Airtable", purpose: "Pulls current products, prices, and stock.", credentialsNeeded: "Airtable personal access token", notes: "", group: "data" },
      { name: "AI Sales Agent", type: "OpenAI", purpose: "Answers questions and drives toward a confirmed order.", credentialsNeeded: "OpenAI API key", notes: "Fixed system prompt; refuses off-topic requests.", group: "ai" },
      { name: "Detect Order Intent", type: "IF", purpose: "Branches when the agent detects a confirmed order.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Extract Order Fields", type: "OpenAI", purpose: "Structures the confirmed order into JSON.", credentialsNeeded: "OpenAI API key", notes: "", group: "ai" },
      { name: "Validate Stock", type: "Code", purpose: "Checks quantities against the catalog snapshot.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Create Order Record", type: "Airtable", purpose: "Writes the order to the Orders table.", credentialsNeeded: "Airtable personal access token", notes: "", group: "data" },
      { name: "Update Conversation State", type: "Airtable", purpose: "Saves the updated conversation history.", credentialsNeeded: "Airtable personal access token", notes: "", group: "data" },
      { name: "Send Reply", type: "HTTP Request", purpose: "Sends the agent's reply back to Messenger.", credentialsNeeded: "Facebook Page access token", notes: "", group: "output" },
      { name: "Notify Team", type: "Telegram", purpose: "Alerts the team when a new order is captured.", credentialsNeeded: "Telegram bot token", notes: "", group: "output" },
      { name: "Rate Limit Guard", type: "Code", purpose: "Caps AI calls per PSID per hour.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Escalation Check", type: "IF", purpose: "Flags conversations the agent should hand off to a human.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Escalation Alert", type: "Slack", purpose: "Pings a human when escalation is needed.", credentialsNeeded: "Slack webhook", notes: "", group: "output" },
      { name: "Error Handler", type: "Error Trigger", purpose: "Logs failures for review.", credentialsNeeded: "Airtable personal access token", notes: "", group: "logic" },
    ],
    howToSteps: [
      { step: 1, name: "Import the JSON into n8n", text: "Import the FlowSaaS JSON into a new n8n workflow." },
      { step: 2, name: "Set up Airtable base", text: "Create the Products, Orders, and Conversations tables using the provided template." },
      { step: 3, name: "Connect credentials", text: "Connect Airtable, OpenAI, and your Meta app credentials." },
      { step: 4, name: "Load your catalog", text: "Add your real products, prices, and stock to the Products table." },
      { step: 5, name: "Test the agent", text: "Send a few test messages to confirm the agent stays on-topic and captures orders correctly." },
      { step: 6, name: "Activate", text: "Activate the workflow and monitor the first few live conversations." },
    ],
    faqs: [
      { id: "f1", question: "Can the agent go off-script?", answerMd: "The system prompt restricts it to your catalog and a fixed set of approved responses, and refuses off-topic requests by design.", answerPlain: "The system prompt restricts it to your catalog and a fixed set of approved responses, and refuses off-topic requests by design." },
      { id: "f2", question: "What if a customer needs a human?", answerMd: "The Escalation Check node flags conversations that need a human and pings your team on Slack immediately.", answerPlain: "The Escalation Check node flags conversations that need a human and pings your team on Slack immediately." },
      { id: "f3", question: "Does it check stock before confirming an order?", answerMd: "Yes — the Validate Stock node checks quantities against the current catalog snapshot before the order is written.", answerPlain: "Yes — the Validate Stock node checks quantities against the current catalog snapshot before the order is written." },
      { id: "f4", question: "Is this within Meta's messaging rules?", answerMd: "Yes, replies go out via the Send API within the standard 24-hour messaging window, same as the other Messenger workflows.", answerPlain: "Yes, replies go out via the Send API within the standard 24-hour messaging window, same as the other Messenger workflows." },
    ],
  },

  "facebook-comment-to-messenger-lead-tagger": {
    subtitle: "Public Page comments become private Messenger replies, tagged by intent and logged to Sheets.",
    descriptionMd:
      "**The problem:** Comments on ads and posts are full of buying signals, but replying publicly is slow and easy to miss.\n\n**The solution:** This workflow watches your Facebook Page for new comments, sends a private Messenger reply to the commenter, tags the comment's intent with AI, and logs it to Google Sheets so nothing falls through.",
    n8nMinVersion: "1.58.0",
    nodes: [
      { name: "Page Comment Webhook", type: "Webhook", purpose: "Receives new-comment events from the Graph API.", credentialsNeeded: null, notes: "", group: "trigger" },
      { name: "Verify Signature", type: "Code", purpose: "Validates the webhook signature.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Filter Own Comments", type: "IF", purpose: "Ignores comments made by the Page itself.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Classify Intent", type: "OpenAI", purpose: "Tags the comment as pricing, complaint, or general interest.", credentialsNeeded: "OpenAI API key", notes: "", group: "ai" },
      { name: "Private Reply", type: "HTTP Request", purpose: "Sends a private reply to the commenter via Messenger.", credentialsNeeded: "Facebook Page access token", notes: "", group: "output" },
      { name: "Public Acknowledgement", type: "HTTP Request", purpose: "Posts a short public reply thanking the commenter.", credentialsNeeded: "Facebook Page access token", notes: "", group: "output" },
      { name: "Find Existing Row", type: "Google Sheets", purpose: "Checks whether this commenter already has a row.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "data" },
      { name: "Upsert Lead Row", type: "Google Sheets", purpose: "Appends or updates the lead with its intent tag.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "data" },
      { name: "High-Intent Filter", type: "IF", purpose: "Branches on pricing/purchase-intent comments.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Notify Team", type: "Telegram", purpose: "Alerts the team about high-intent comments.", credentialsNeeded: "Telegram bot token", notes: "", group: "output" },
      { name: "Rate Limit Guard", type: "Code", purpose: "Avoids re-processing edited comments repeatedly.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Error Handler", type: "Error Trigger", purpose: "Logs failed replies for review.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "logic" },
    ],
    howToSteps: [
      { step: 1, name: "Import the JSON into n8n", text: "Import the FlowSaaS JSON into a new n8n workflow." },
      { step: 2, name: "Create the Google Sheet", text: "Create the sheet using the provided column template." },
      { step: 3, name: "Connect credentials", text: "Connect Google Sheets, OpenAI, and your Meta app." },
      { step: 4, name: "Subscribe to comment events", text: "Subscribe your Page to the feed webhook for comment events." },
      { step: 5, name: "Test on a real post", text: "Comment on a test post yourself and confirm the private reply arrives." },
      { step: 6, name: "Activate", text: "Activate the workflow on your live Page." },
    ],
    faqs: [
      { id: "f1", question: "Does it reply publicly or privately?", answerMd: "Both — a short public acknowledgement, plus a private Messenger reply with more detail, which starts a standard 24-hour messaging window.", answerPlain: "Both — a short public acknowledgement, plus a private Messenger reply with more detail, which starts a standard 24-hour messaging window." },
      { id: "f2", question: "Does it process comments on old posts too?", answerMd: "Only new comments after the webhook subscription is active — it doesn't backfill historical comments.", answerPlain: "Only new comments after the webhook subscription is active — it doesn't backfill historical comments." },
      { id: "f3", question: "What if someone edits their comment?", answerMd: "The Rate Limit Guard node prevents the same comment ID from triggering a second reply within a short window.", answerPlain: "The Rate Limit Guard node prevents the same comment ID from triggering a second reply within a short window." },
      { id: "f4", question: "Can I customize the reply wording?", answerMd: "Yes — the reply templates are plain text in the workflow and can be edited per intent tag without touching the AI step.", answerPlain: "Yes — the reply templates are plain text in the workflow and can be edited per intent tag without touching the AI step." },
    ],
  },

  "google-maps-lead-scraper-airtable": {
    subtitle: "Find local businesses via the Google Places API, enrich them with AI, and build a call list in Airtable.",
    descriptionMd:
      "**The problem:** Building a prospect list of local businesses by hand — searching, copying details, guessing contact info — takes hours per city or niche.\n\n**The solution:** This workflow queries the Google Places API for a business type and area, enriches each result with AI-inferred contact details and a one-line pitch angle, de-duplicates against your existing base, and writes a ready-to-call list to Airtable.",
    n8nMinVersion: "1.58.0",
    nodes: [
      { name: "Manual/Webhook Trigger", type: "Webhook", purpose: "Starts a search run with a query and area.", credentialsNeeded: null, notes: "", group: "trigger" },
      { name: "Places Text Search", type: "HTTP Request", purpose: "Queries the Google Places API for matching businesses.", credentialsNeeded: "Google Places API key", notes: "", group: "data" },
      { name: "Places Details", type: "HTTP Request", purpose: "Fetches phone, website, and rating for each result.", credentialsNeeded: "Google Places API key", notes: "", group: "data" },
      { name: "Filter by Rating", type: "IF", purpose: "Drops results below a minimum rating threshold.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Find Existing Record", type: "Airtable", purpose: "Checks for an existing record by Place ID.", credentialsNeeded: "Airtable personal access token", notes: "", group: "data" },
      { name: "Enrich Contact & Pitch", type: "OpenAI", purpose: "Infers a likely contact role and drafts a one-line pitch angle.", credentialsNeeded: "OpenAI API key", notes: "", group: "ai" },
      { name: "Normalize Phone/Website", type: "Code", purpose: "Cleans phone formatting and website URLs.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Upsert Lead Record", type: "Airtable", purpose: "Writes or updates the business in the Leads table.", credentialsNeeded: "Airtable personal access token", notes: "", group: "data" },
      { name: "Batch Counter", type: "Code", purpose: "Tracks how many results have been processed this run.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Pagination Handler", type: "HTTP Request", purpose: "Follows the Places API's next-page token.", credentialsNeeded: "Google Places API key", notes: "", group: "data" },
      { name: "Run Summary", type: "Code", purpose: "Builds a summary of how many leads were added.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Notify Team", type: "Slack", purpose: "Posts the run summary to Slack.", credentialsNeeded: "Slack webhook", notes: "", group: "output" },
      { name: "Error Handler", type: "Error Trigger", purpose: "Logs API failures for review.", credentialsNeeded: "Airtable personal access token", notes: "", group: "logic" },
    ],
    howToSteps: [
      { step: 1, name: "Import the JSON into n8n", text: "Import the FlowSaaS JSON into a new n8n workflow." },
      { step: 2, name: "Set up the Airtable base", text: "Create the Leads table using the provided column template." },
      { step: 3, name: "Enable the Places API", text: "Enable the Google Places API on a Google Cloud project and generate a key." },
      { step: 4, name: "Connect credentials", text: "Connect Airtable, OpenAI, and your Google Places API key." },
      { step: 5, name: "Run a test search", text: "Trigger a search for a small area and confirm results land in Airtable." },
      { step: 6, name: "Activate", text: "Activate the workflow and run it for your target markets." },
    ],
    faqs: [
      { id: "f1", question: "Does this scrape Facebook or LinkedIn profiles?", answerMd: "No — it uses only the official Google Places API, never scraping. It doesn't touch Facebook, LinkedIn, or Instagram profiles.", answerPlain: "No — it uses only the official Google Places API, never scraping. It doesn't touch Facebook, LinkedIn, or Instagram profiles." },
      { id: "f2", question: "Does the Places API cost extra?", answerMd: "Yes — Google bills Places API usage directly on your own Google Cloud project; this workflow doesn't include Google's usage costs.", answerPlain: "Yes — Google bills Places API usage directly on your own Google Cloud project; this workflow doesn't include Google's usage costs." },
      { id: "f3", question: "How accurate is the AI-inferred contact info?", answerMd: "The AI step infers a likely role and pitch angle from public business details — it doesn't guess personal emails or phone numbers.", answerPlain: "The AI step infers a likely role and pitch angle from public business details — it doesn't guess personal emails or phone numbers." },
      { id: "f4", question: "Does it avoid duplicate entries on repeat runs?", answerMd: "Yes — the Find Existing Record node checks each business's Place ID before writing, so re-running a search updates rather than duplicates.", answerPlain: "Yes — the Find Existing Record node checks each business's Place ID before writing, so re-running a search updates rather than duplicates." },
    ],
  },

  "website-form-lead-enrichment-alerts": {
    subtitle: "Every website form submission is enriched, scored, logged, and alerted on — in seconds.",
    descriptionMd:
      "**The problem:** Form submissions land in an inbox or a spreadsheet with no context, so following up means manually researching each lead first.\n\n**The solution:** This workflow accepts a webhook from any form tool, enriches the submission with AI (intent, urgency, a one-line summary), logs it to Google Sheets, and alerts your team on Telegram or Slack within seconds.",
    n8nMinVersion: "1.55.0",
    nodes: [
      { name: "Form Webhook", type: "Webhook", purpose: "Receives the form submission as JSON.", credentialsNeeded: null, notes: "", group: "trigger" },
      { name: "Validate Payload", type: "Code", purpose: "Checks required fields are present.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Enrich & Score", type: "OpenAI", purpose: "Summarizes intent and assigns an urgency score.", credentialsNeeded: "OpenAI API key", notes: "", group: "ai" },
      { name: "Log to Sheet", type: "Google Sheets", purpose: "Appends the enriched lead to your tracking sheet.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "data" },
      { name: "Urgency Filter", type: "IF", purpose: "Branches high-urgency leads to immediate alerting.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Telegram Alert", type: "Telegram", purpose: "Sends an instant alert for urgent leads.", credentialsNeeded: "Telegram bot token", notes: "", group: "output" },
      { name: "Slack Alert", type: "Slack", purpose: "Posts a summary to your team's Slack channel.", credentialsNeeded: "Slack webhook", notes: "", group: "output" },
      { name: "Confirmation Response", type: "Respond to Webhook", purpose: "Returns a JSON success response to the form tool.", credentialsNeeded: null, notes: "", group: "output" },
      { name: "Error Handler", type: "Error Trigger", purpose: "Logs failed enrichments for review.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "logic" },
    ],
    howToSteps: [
      { step: 1, name: "Import the JSON into n8n", text: "Import the FlowSaaS JSON into a new n8n workflow." },
      { step: 2, name: "Create the tracking sheet", text: "Create the Google Sheet using the provided column template." },
      { step: 3, name: "Connect credentials", text: "Connect Google Sheets, OpenAI, and Telegram/Slack." },
      { step: 4, name: "Point your form at the webhook", text: "Set your form tool's submit action (or webhook integration) to this workflow's URL." },
      { step: 5, name: "Test with a real submission", text: "Submit your form once and confirm the sheet row and alerts arrive." },
      { step: 6, name: "Activate", text: "Activate the workflow on your live site." },
    ],
    faqs: [
      { id: "f1", question: "What form tools does this work with?", answerMd: "Any tool that can POST JSON to a webhook — most form builders (Typeform, Tally, a custom HTML form) support this out of the box.", answerPlain: "Any tool that can POST JSON to a webhook — most form builders (Typeform, Tally, a custom HTML form) support this out of the box." },
      { id: "f2", question: "Can I skip Telegram or Slack?", answerMd: "Yes — both notification nodes are optional; disable either one you don't use without affecting the rest of the workflow.", answerPlain: "Yes — both notification nodes are optional; disable either one you don't use without affecting the rest of the workflow." },
      { id: "f3", question: "How is urgency scored?", answerMd: "The AI step looks at the submission's language and any budget/timeline fields you pass in, then assigns a 0-100 urgency score.", answerPlain: "The AI step looks at the submission's language and any budget/timeline fields you pass in, then assigns a 0-100 urgency score." },
      { id: "f4", question: "What if the webhook receives spam?", answerMd: "Pair this with a CAPTCHA or honeypot field on your form — the workflow itself doesn't filter spam submissions.", answerPlain: "Pair this with a CAPTCHA or honeypot field on your form — the workflow itself doesn't filter spam submissions." },
    ],
  },

  "multi-channel-content-distributor": {
    subtitle: "One WordPress post becomes channel-ready versions for LinkedIn, X, your Facebook Page, and Telegram.",
    descriptionMd:
      "**The problem:** Reformatting one blog post into a LinkedIn post, an X thread, a Facebook Page post, and a Telegram announcement by hand takes longer than writing the post itself.\n\n**The solution:** This workflow watches your WordPress feed for new posts, uses AI to adapt the content's tone and length per channel, and publishes to LinkedIn, X, your Facebook Page, and Telegram automatically.",
    n8nMinVersion: "1.58.0",
    nodes: [
      { name: "WordPress Trigger", type: "WordPress", purpose: "Fires when a new post is published.", credentialsNeeded: "WordPress application password", notes: "", group: "trigger" },
      { name: "Fetch Full Post", type: "HTTP Request", purpose: "Pulls the full post content and featured image.", credentialsNeeded: "WordPress application password", notes: "", group: "data" },
      { name: "Adapt for LinkedIn", type: "OpenAI", purpose: "Rewrites the post as a LinkedIn-style update.", credentialsNeeded: "OpenAI API key", notes: "", group: "ai" },
      { name: "Adapt for X", type: "OpenAI", purpose: "Condenses the post into an X thread.", credentialsNeeded: "OpenAI API key", notes: "", group: "ai" },
      { name: "Adapt for Facebook", type: "OpenAI", purpose: "Rewrites the post for a Facebook Page audience.", credentialsNeeded: "OpenAI API key", notes: "", group: "ai" },
      { name: "Adapt for Telegram", type: "OpenAI", purpose: "Writes a short Telegram announcement with a link.", credentialsNeeded: "OpenAI API key", notes: "", group: "ai" },
      { name: "Publish to LinkedIn", type: "HTTP Request", purpose: "Posts the adapted update via the Marketing API.", credentialsNeeded: "LinkedIn Marketing API access", notes: "", group: "output" },
      { name: "Publish to X", type: "HTTP Request", purpose: "Posts the thread via the X API.", credentialsNeeded: "X developer app", notes: "", group: "output" },
      { name: "Publish to Facebook Page", type: "HTTP Request", purpose: "Posts to the Page via the Graph API.", credentialsNeeded: "Facebook Page access token", notes: "", group: "output" },
      { name: "Publish to Telegram", type: "Telegram", purpose: "Sends the announcement to your channel.", credentialsNeeded: "Telegram bot token", notes: "", group: "output" },
      { name: "Track Publish Results", type: "Code", purpose: "Collects success/failure per channel.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Retry Failed Channel", type: "IF", purpose: "Retries a single channel once on failure.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Summary Notification", type: "Slack", purpose: "Posts a per-channel publish summary.", credentialsNeeded: "Slack webhook", notes: "", group: "output" },
      { name: "Rate Limit Guard", type: "Code", purpose: "Spaces out API calls per channel's rate limit.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Error Handler", type: "Error Trigger", purpose: "Logs any channel that fails after retry.", credentialsNeeded: null, notes: "", group: "logic" },
    ],
    howToSteps: [
      { step: 1, name: "Import the JSON into n8n", text: "Import the FlowSaaS JSON into a new n8n workflow." },
      { step: 2, name: "Connect WordPress", text: "Generate a WordPress application password and connect it." },
      { step: 3, name: "Connect the channels you use", text: "Connect LinkedIn, X, Facebook Pages, and Telegram credentials — skip any you don't use." },
      { step: 4, name: "Review the AI prompts", text: "Check the per-channel adaptation prompts and adjust tone if needed." },
      { step: 5, name: "Test with a draft post", text: "Publish a test WordPress post and confirm each connected channel receives it." },
      { step: 6, name: "Activate", text: "Activate the workflow so it runs on every future publish." },
    ],
    faqs: [
      { id: "f1", question: "Can I use only some of the four channels?", answerMd: "Yes — disable the publish node for any channel you don't use; the rest of the workflow is unaffected.", answerPlain: "Yes — disable the publish node for any channel you don't use; the rest of the workflow is unaffected." },
      { id: "f2", question: "Does it post images too?", answerMd: "Yes, where the channel's API supports it — the featured image is carried through to LinkedIn and Facebook Page posts.", answerPlain: "Yes, where the channel's API supports it — the featured image is carried through to LinkedIn and Facebook Page posts." },
      { id: "f3", question: "What happens if one channel's API is down?", answerMd: "The Retry Failed Channel node retries once; if it still fails, that channel is logged and skipped without blocking the others.", answerPlain: "The Retry Failed Channel node retries once; if it still fails, that channel is logged and skipped without blocking the others." },
      { id: "f4", question: "Can I review posts before they go out?", answerMd: "Not in this workflow — for an approval step first, see the RSS to AI-Written Social Posts workflow, which includes a queue.", answerPlain: "Not in this workflow — for an approval step first, see the RSS to AI-Written Social Posts workflow, which includes a queue." },
    ],
  },

  "rss-to-ai-social-scheduler": {
    subtitle: "Any RSS feed becomes AI-drafted social posts, queued in Sheets for your approval before publishing.",
    descriptionMd:
      "**The problem:** Turning a content feed into social posts is repetitive, but posting without any human review is risky.\n\n**The solution:** This workflow polls an RSS feed, drafts a social post with AI for each new item, writes it to a Google Sheet approval queue, and pings Slack the moment a draft is ready for your sign-off.",
    n8nMinVersion: "1.55.0",
    nodes: [
      { name: "RSS Feed Read", type: "RSS Feed Read", purpose: "Polls the feed on a schedule for new items.", credentialsNeeded: null, notes: "", group: "trigger" },
      { name: "De-duplicate Items", type: "Code", purpose: "Skips items already processed in a prior run.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Draft Social Post", type: "OpenAI", purpose: "Writes a social-ready post from the feed item.", credentialsNeeded: "OpenAI API key", notes: "", group: "ai" },
      { name: "Add to Approval Queue", type: "Google Sheets", purpose: "Appends the draft with a pending status.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "data" },
      { name: "Notify Reviewer", type: "Slack", purpose: "Pings Slack that a new draft is ready to review.", credentialsNeeded: "Slack webhook", notes: "", group: "output" },
      { name: "Poll for Approvals", type: "Google Sheets", purpose: "Checks the sheet for rows marked Approved.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "data" },
      { name: "Mark as Published", type: "Google Sheets", purpose: "Updates the row's status once posted.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "data" },
      { name: "Schedule Check", type: "Schedule Trigger", purpose: "Runs the approval-poll on a short interval.", credentialsNeeded: null, notes: "", group: "trigger" },
      { name: "Format for Posting", type: "Code", purpose: "Prepares the approved text for publishing.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Retry on Failure", type: "IF", purpose: "Retries a failed publish once.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Publish Notification", type: "Slack", purpose: "Confirms in Slack once a post goes live.", credentialsNeeded: "Slack webhook", notes: "", group: "output" },
      { name: "Error Handler", type: "Error Trigger", purpose: "Logs failed drafts or publishes.", credentialsNeeded: null, notes: "", group: "logic" },
    ],
    howToSteps: [
      { step: 1, name: "Import the JSON into n8n", text: "Import the FlowSaaS JSON into a new n8n workflow." },
      { step: 2, name: "Set up the approval sheet", text: "Create the Google Sheet using the provided column template (Draft, Status, Published At)." },
      { step: 3, name: "Connect credentials", text: "Connect Google Sheets, OpenAI, and Slack." },
      { step: 4, name: "Add your RSS feed URL", text: "Paste your blog or content source's RSS feed URL into the trigger node." },
      { step: 5, name: "Test the approval flow", text: "Let one draft generate, mark it Approved in the sheet, and confirm it publishes." },
      { step: 6, name: "Activate", text: "Activate both the feed-poll and approval-poll schedules." },
    ],
    faqs: [
      { id: "f1", question: "Does this post automatically without review?", answerMd: "No — every draft sits in the approval queue until someone marks it Approved in the sheet. That's the point of this workflow versus the direct distributor.", answerPlain: "No — every draft sits in the approval queue until someone marks it Approved in the sheet. That's the point of this workflow versus the direct distributor." },
      { id: "f2", question: "Which social network does it publish to?", answerMd: "The template ships wired to one channel via a generic HTTP Request node — swap in your platform's API details in that node.", answerPlain: "The template ships wired to one channel via a generic HTTP Request node — swap in your platform's API details in that node." },
      { id: "f3", question: "How often does it check the RSS feed?", answerMd: "The default schedule polls every 30 minutes — adjust the Schedule Trigger's interval to match how often your feed updates.", answerPlain: "The default schedule polls every 30 minutes — adjust the Schedule Trigger's interval to match how often your feed updates." },
      { id: "f4", question: "Can multiple people approve drafts?", answerMd: "Yes — anyone with edit access to the Google Sheet can approve a draft by changing its Status column.", answerPlain: "Yes — anyone with edit access to the Google Sheet can approve a draft by changing its Status column." },
    ],
  },

  "shopify-order-telegram-fulfilment-sheet": {
    subtitle: "Every Shopify order triggers an instant Telegram alert and a live fulfilment-tracking row in Sheets.",
    descriptionMd:
      "**The problem:** Checking Shopify constantly for new orders, then manually updating a fulfilment spreadsheet, wastes time and causes missed orders.\n\n**The solution:** This workflow listens to Shopify's order webhook, posts an instant Telegram alert with the order details, and appends a row to a Google Sheets fulfilment tracker your team updates as they pack and ship.",
    n8nMinVersion: "1.50.0",
    nodes: [
      { name: "Shopify Order Webhook", type: "Shopify Trigger", purpose: "Fires on orders/create.", credentialsNeeded: "Shopify Admin API access token", notes: "", group: "trigger" },
      { name: "Format Order Summary", type: "Code", purpose: "Builds a readable summary of items and shipping address.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Telegram Alert", type: "Telegram", purpose: "Sends the order summary to your fulfilment channel.", credentialsNeeded: "Telegram bot token", notes: "", group: "output" },
      { name: "Append Fulfilment Row", type: "Google Sheets", purpose: "Adds the order to the tracker with status \"New\".", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "data" },
      { name: "Paid Filter", type: "IF", purpose: "Branches on payment status.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Error Handler", type: "Error Trigger", purpose: "Logs failed writes for review.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "logic" },
      { name: "Currency Formatter", type: "Code", purpose: "Formats order totals for the target locale.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Low-Stock Flag", type: "Code", purpose: "Flags line items now below a stock threshold.", credentialsNeeded: null, notes: "", group: "logic" },
    ],
    howToSteps: [
      { step: 1, name: "Import the JSON into n8n", text: "Import the FlowSaaS JSON into a new n8n workflow." },
      { step: 2, name: "Create the fulfilment sheet", text: "Create the Google Sheet using the provided column template." },
      { step: 3, name: "Connect credentials", text: "Connect Shopify, Google Sheets, and Telegram." },
      { step: 4, name: "Register the webhook", text: "Register the orders/create webhook in your Shopify admin, pointing at this workflow's URL." },
      { step: 5, name: "Place a test order", text: "Place a test order (or use Shopify's test mode) and confirm the alert and sheet row appear." },
      { step: 6, name: "Activate", text: "Activate the workflow on your live store." },
    ],
    faqs: [
      { id: "f1", question: "Does this handle order edits or cancellations?", answerMd: "This template covers new orders only; order edits and cancellations can be added with a second Shopify Trigger node for those events.", answerPlain: "This template covers new orders only; order edits and cancellations can be added with a second Shopify Trigger node for those events." },
      { id: "f2", question: "Can I use Slack instead of Telegram?", answerMd: "Yes — swap the Telegram node for a Slack node; the rest of the workflow is unaffected.", answerPlain: "Yes — swap the Telegram node for a Slack node; the rest of the workflow is unaffected." },
      { id: "f3", question: "Does it work with multiple Shopify locations?", answerMd: "Yes — location data comes through in the order payload and can be added as a column in the fulfilment sheet.", answerPlain: "Yes — location data comes through in the order payload and can be added as a column in the fulfilment sheet." },
      { id: "f4", question: "What if a payment is still pending?", answerMd: "The Paid Filter node lets you route unpaid orders differently (e.g., a separate \"awaiting payment\" sheet tab) rather than alerting fulfilment immediately.", answerPlain: "The Paid Filter node lets you route unpaid orders differently (e.g., a separate \"awaiting payment\" sheet tab) rather than alerting fulfilment immediately." },
    ],
  },

  "abandoned-cart-recovery-messenger-email": {
    subtitle: "Recover abandoned Shopify carts with a timed, opt-in Messenger nudge and a follow-up email.",
    descriptionMd:
      "**The problem:** Most abandoned-cart recovery is email-only, and generic template emails get ignored.\n\n**The solution:** This workflow detects an abandoned Shopify checkout, waits a configurable delay, sends an opt-in Messenger reminder if the customer has previously messaged your Page, and follows up by email with a discount code if the cart is still unrecovered after 24 hours.",
    n8nMinVersion: "1.58.0",
    nodes: [
      { name: "Checkout Abandoned Webhook", type: "Shopify Trigger", purpose: "Fires on checkouts/create without a matching order.", credentialsNeeded: "Shopify Admin API access token", notes: "", group: "trigger" },
      { name: "Wait (Recovery Delay)", type: "Wait", purpose: "Pauses before the first nudge (default 1 hour).", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Check Order Completed", type: "HTTP Request", purpose: "Confirms the cart wasn't completed while waiting.", credentialsNeeded: "Shopify Admin API access token", notes: "", group: "data" },
      { name: "Messenger Opt-in Check", type: "Airtable", purpose: "Checks whether this customer has an active Messenger opt-in.", credentialsNeeded: "Airtable personal access token", notes: "", group: "data" },
      { name: "Send Messenger Nudge", type: "HTTP Request", purpose: "Sends a reminder if opted in and within the messaging window.", credentialsNeeded: "Facebook Page access token", notes: "", group: "output" },
      { name: "Wait (Email Delay)", type: "Wait", purpose: "Waits until the 24-hour mark before emailing.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Check Order Completed Again", type: "HTTP Request", purpose: "Re-confirms the cart is still unrecovered.", credentialsNeeded: "Shopify Admin API access token", notes: "", group: "data" },
      { name: "Generate Discount Code", type: "HTTP Request", purpose: "Creates a single-use discount code via the Shopify API.", credentialsNeeded: "Shopify Admin API access token", notes: "", group: "data" },
      { name: "Draft Recovery Email", type: "OpenAI", purpose: "Personalizes the follow-up email using the cart contents.", credentialsNeeded: "OpenAI API key", notes: "", group: "ai" },
      { name: "Send Recovery Email", type: "Gmail", purpose: "Sends the follow-up email with the discount code.", credentialsNeeded: "Gmail OAuth", notes: "", group: "output" },
      { name: "Log Recovery Attempt", type: "Airtable", purpose: "Records the attempt and outcome.", credentialsNeeded: "Airtable personal access token", notes: "", group: "data" },
      { name: "Consent Guard", type: "IF", purpose: "Blocks messaging to customers without valid opt-in/consent.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Frequency Cap", type: "Code", purpose: "Prevents re-targeting the same cart more than once.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Error Handler", type: "Error Trigger", purpose: "Logs failures in the recovery sequence.", credentialsNeeded: "Airtable personal access token", notes: "", group: "logic" },
    ],
    howToSteps: [
      { step: 1, name: "Import the JSON into n8n", text: "Import the FlowSaaS JSON into a new n8n workflow." },
      { step: 2, name: "Set up the tracking base", text: "Create the Airtable base for opt-ins and recovery attempts using the provided template." },
      { step: 3, name: "Connect credentials", text: "Connect Shopify, Gmail, OpenAI, Airtable, and your Meta app." },
      { step: 4, name: "Register the checkout webhook", text: "Register the checkouts/create webhook in Shopify, pointing at this workflow." },
      { step: 5, name: "Set your delays", text: "Adjust the two Wait nodes to match your desired recovery timing." },
      { step: 6, name: "Test and activate", text: "Abandon a test checkout, confirm both touches fire correctly, then activate on your live store." },
    ],
    faqs: [
      { id: "f1", question: "Is the Messenger nudge sent to everyone?", answerMd: "No — only to customers who have an existing opt-in on file and are within Meta's 24-hour standard messaging window; otherwise, only the email touch runs.", answerPlain: "No — only to customers who have an existing opt-in on file and are within Meta's 24-hour standard messaging window; otherwise, only the email touch runs." },
      { id: "f2", question: "Why is this marked Advanced?", answerMd: "It coordinates two channels, two timed delays, discount code generation, and a consent check — more moving parts than the other templates, so it takes longer to configure correctly.", answerPlain: "It coordinates two channels, two timed delays, discount code generation, and a consent check — more moving parts than the other templates, so it takes longer to configure correctly." },
      { id: "f3", question: "Can I change the discount amount?", answerMd: "Yes — the discount percentage and expiry are parameters in the Generate Discount Code node.", answerPlain: "Yes — the discount percentage and expiry are parameters in the Generate Discount Code node." },
      { id: "f4", question: "What stops it from emailing someone who already checked out?", answerMd: "Both Wait steps are followed by a fresh order-status check, so a completed order stops the sequence before the next touch fires.", answerPlain: "Both Wait steps are followed by a fresh order-status check, so a completed order stops the sequence before the next touch fires." },
    ],
  },

  "shopify-low-stock-supplier-reorder": {
    subtitle: "Get ahead of stockouts with automatic low-stock alerts and AI-drafted supplier reorder emails.",
    descriptionMd:
      "**The problem:** Noticing you're low on stock usually happens too late — after a customer already couldn't check out.\n\n**The solution:** This workflow checks Shopify inventory levels on a schedule, logs anything below your threshold to Google Sheets, and drafts a ready-to-send reorder email to the right supplier so you just have to hit send.",
    n8nMinVersion: "1.50.0",
    nodes: [
      { name: "Schedule Trigger", type: "Schedule Trigger", purpose: "Runs the stock check daily.", credentialsNeeded: null, notes: "", group: "trigger" },
      { name: "Fetch Inventory Levels", type: "HTTP Request", purpose: "Pulls current stock for all tracked SKUs.", credentialsNeeded: "Shopify Admin API access token", notes: "", group: "data" },
      { name: "Filter Below Threshold", type: "IF", purpose: "Keeps only SKUs under their reorder point.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Look Up Supplier", type: "Google Sheets", purpose: "Matches each SKU to its supplier and contact email.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "data" },
      { name: "Log Low-Stock Item", type: "Google Sheets", purpose: "Appends the item to the low-stock tracker.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "data" },
      { name: "Draft Reorder Email", type: "OpenAI", purpose: "Writes a ready-to-send reorder request per supplier.", credentialsNeeded: "OpenAI API key", notes: "", group: "ai" },
      { name: "Create Gmail Draft", type: "Gmail", purpose: "Saves the reorder email as a draft (not sent automatically).", credentialsNeeded: "Gmail OAuth", notes: "Drafts only — a human reviews and sends.", group: "output" },
      { name: "Group by Supplier", type: "Code", purpose: "Batches multiple low-stock SKUs into one email per supplier.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Error Handler", type: "Error Trigger", purpose: "Logs failures reading inventory or drafting email.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "logic" },
    ],
    howToSteps: [
      { step: 1, name: "Import the JSON into n8n", text: "Import the FlowSaaS JSON into a new n8n workflow." },
      { step: 2, name: "Set up the supplier sheet", text: "Create the Google Sheet with SKU, reorder point, and supplier contact columns." },
      { step: 3, name: "Connect credentials", text: "Connect Shopify, Google Sheets, OpenAI, and Gmail." },
      { step: 4, name: "Set your reorder points", text: "Fill in the reorder threshold for each SKU in the sheet." },
      { step: 5, name: "Run it once manually", text: "Execute the workflow manually and confirm the Gmail draft looks right." },
      { step: 6, name: "Activate the schedule", text: "Activate the daily schedule trigger." },
    ],
    faqs: [
      { id: "f1", question: "Does it send the reorder email automatically?", answerMd: "No — it creates a Gmail draft only, so a person reviews quantities and pricing before it's sent.", answerPlain: "No — it creates a Gmail draft only, so a person reviews quantities and pricing before it's sent." },
      { id: "f2", question: "Can one email cover multiple low-stock items?", answerMd: "Yes — the Group by Supplier node batches every low-stock SKU from the same supplier into a single draft.", answerPlain: "Yes — the Group by Supplier node batches every low-stock SKU from the same supplier into a single draft." },
      { id: "f3", question: "How is the reorder threshold set?", answerMd: "You set it per SKU in the Google Sheet — there's no single global threshold, since different products sell at different rates.", answerPlain: "You set it per SKU in the Google Sheet — there's no single global threshold, since different products sell at different rates." },
      { id: "f4", question: "Does this work with Shopify's multi-location inventory?", answerMd: "It reads total available inventory across locations by default; a per-location breakdown can be added by adjusting the Fetch Inventory Levels node's query.", answerPlain: "It reads total available inventory across locations by default; a per-location breakdown can be added by adjusting the Fetch Inventory Levels node's query." },
    ],
  },

  "ai-support-ticket-triage": {
    subtitle: "Every support email is triaged by AI, logged with priority, and routed to the right person on Telegram.",
    descriptionMd:
      "**The problem:** Support emails pile up in one inbox with no priority sorting, so urgent issues wait behind routine questions.\n\n**The solution:** This workflow reads new support emails, uses AI to classify priority and category, logs a structured ticket to Airtable, and alerts your team on Telegram the moment something urgent comes in.",
    n8nMinVersion: "1.58.0",
    nodes: [
      { name: "Gmail Trigger", type: "Gmail Trigger", purpose: "Watches the support inbox for new emails.", credentialsNeeded: "Gmail OAuth", notes: "", group: "trigger" },
      { name: "Extract Email Body", type: "Code", purpose: "Cleans quoted text and signatures from the email body.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Classify Ticket", type: "OpenAI", purpose: "Returns priority, category, and a one-line summary.", credentialsNeeded: "OpenAI API key", notes: "", group: "ai" },
      { name: "Find Existing Customer", type: "Airtable", purpose: "Looks up the sender in your customer base.", credentialsNeeded: "Airtable personal access token", notes: "", group: "data" },
      { name: "Create Ticket Record", type: "Airtable", purpose: "Logs the ticket with priority and category.", credentialsNeeded: "Airtable personal access token", notes: "", group: "data" },
      { name: "Priority Filter", type: "IF", purpose: "Branches on High/Urgent priority tickets.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Urgent Alert", type: "Telegram", purpose: "Pings the on-call channel for urgent tickets.", credentialsNeeded: "Telegram bot token", notes: "", group: "output" },
      { name: "Auto-Acknowledge", type: "Gmail", purpose: "Sends a \"we got your message\" reply with an estimated response time.", credentialsNeeded: "Gmail OAuth", notes: "", group: "output" },
      { name: "Category Router", type: "Switch", purpose: "Routes billing, technical, and general tickets differently.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Duplicate Detection", type: "Code", purpose: "Flags likely duplicate tickets from the same thread.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "SLA Timer Start", type: "Code", purpose: "Records the SLA clock start time on the ticket.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Sentiment Flag", type: "OpenAI", purpose: "Flags tickets with strongly negative sentiment for review.", credentialsNeeded: "OpenAI API key", notes: "", group: "ai" },
      { name: "Escalation Alert", type: "Telegram", purpose: "Separately alerts on negative-sentiment tickets.", credentialsNeeded: "Telegram bot token", notes: "", group: "output" },
      { name: "Error Handler", type: "Error Trigger", purpose: "Logs classification or logging failures.", credentialsNeeded: "Airtable personal access token", notes: "", group: "logic" },
    ],
    howToSteps: [
      { step: 1, name: "Import the JSON into n8n", text: "Import the FlowSaaS JSON into a new n8n workflow." },
      { step: 2, name: "Set up the Airtable base", text: "Create the Tickets and Customers tables using the provided template." },
      { step: 3, name: "Connect credentials", text: "Connect Gmail, OpenAI, Airtable, and Telegram." },
      { step: 4, name: "Point at your support inbox", text: "Connect the Gmail Trigger to the inbox your support emails arrive at." },
      { step: 5, name: "Test with a sample email", text: "Send a test support email and confirm it's classified and logged correctly." },
      { step: 6, name: "Activate", text: "Activate the workflow on your live support inbox." },
    ],
    faqs: [
      { id: "f1", question: "Does it reply to customers automatically?", answerMd: "Only with a short auto-acknowledgement confirming receipt and an estimated response time — a human still writes the real reply.", answerPlain: "Only with a short auto-acknowledgement confirming receipt and an estimated response time — a human still writes the real reply." },
      { id: "f2", question: "How accurate is the priority classification?", answerMd: "It's a strong first pass based on language and urgency cues, but your team should still spot-check priority on tickets near the threshold.", answerPlain: "It's a strong first pass based on language and urgency cues, but your team should still spot-check priority on tickets near the threshold." },
      { id: "f3", question: "Can I add more categories?", answerMd: "Yes — the Category Router's Switch node and the classification prompt both take a configurable list of categories.", answerPlain: "Yes — the Category Router's Switch node and the classification prompt both take a configurable list of categories." },
      { id: "f4", question: "Does it work with a shared support inbox?", answerMd: "Yes — connect the Gmail Trigger to whichever inbox (personal or shared) receives your support email.", answerPlain: "Yes — connect the Gmail Trigger to whichever inbox (personal or shared) receives your support email." },
    ],
  },

  "telegram-ai-knowledge-bot-sheets": {
    subtitle: "A Telegram bot answers customer questions instantly, powered by AI reading your own Google Sheets FAQ.",
    descriptionMd:
      "**The problem:** Customers ask the same handful of questions over and over, and a static FAQ page means they still have to go find it.\n\n**The solution:** This workflow runs a Telegram bot that answers questions directly in chat, using AI to find and paraphrase the closest match from a Google Sheet you maintain — no separate knowledge base tool required.",
    n8nMinVersion: "1.55.0",
    nodes: [
      { name: "Telegram Trigger", type: "Telegram Trigger", purpose: "Receives incoming messages to the bot.", credentialsNeeded: "Telegram bot token", notes: "", group: "trigger" },
      { name: "Load FAQ Sheet", type: "Google Sheets", purpose: "Reads the current FAQ question/answer pairs.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "data" },
      { name: "Find Best Match", type: "OpenAI", purpose: "Matches the question to the closest FAQ entry and paraphrases the answer.", credentialsNeeded: "OpenAI API key", notes: "Fixed system prompt; declines to answer outside the FAQ's scope.", group: "ai" },
      { name: "Confidence Check", type: "IF", purpose: "Branches when no FAQ entry is a close enough match.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Send Answer", type: "Telegram", purpose: "Replies with the matched answer.", credentialsNeeded: "Telegram bot token", notes: "", group: "output" },
      { name: "Send Fallback", type: "Telegram", purpose: "Replies with a fallback message and a human-contact option.", credentialsNeeded: "Telegram bot token", notes: "", group: "output" },
      { name: "Log Unanswered Question", type: "Google Sheets", purpose: "Logs questions the bot couldn't confidently answer.", credentialsNeeded: "Google Sheets OAuth", notes: "So you can add them to the FAQ later.", group: "data" },
      { name: "Cache Sheet Read", type: "Code", purpose: "Caches the FAQ sheet for a few minutes to reduce API calls.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Rate Limit Guard", type: "Code", purpose: "Caps replies per user per minute.", credentialsNeeded: null, notes: "", group: "logic" },
      { name: "Error Handler", type: "Error Trigger", purpose: "Logs failures reading the sheet or calling the AI.", credentialsNeeded: "Google Sheets OAuth", notes: "", group: "logic" },
    ],
    howToSteps: [
      { step: 1, name: "Import the JSON into n8n", text: "Import the FlowSaaS JSON into a new n8n workflow." },
      { step: 2, name: "Create your FAQ sheet", text: "Create the Google Sheet with Question and Answer columns using your real FAQ content." },
      { step: 3, name: "Create the Telegram bot", text: "Create a bot via @BotFather and grab its token." },
      { step: 4, name: "Connect credentials", text: "Connect Google Sheets, OpenAI, and the Telegram bot token." },
      { step: 5, name: "Test with real questions", text: "Ask the bot a few real customer questions and confirm the answers and fallback both work." },
      { step: 6, name: "Activate", text: "Activate the workflow and share the bot with customers." },
    ],
    faqs: [
      { id: "f1", question: "Can the bot answer questions not in the FAQ?", answerMd: "No — by design, it declines and routes to the fallback message rather than making something up, so it never states something you haven't written yourself.", answerPlain: "No — by design, it declines and routes to the fallback message rather than making something up, so it never states something you haven't written yourself." },
      { id: "f2", question: "How do I keep the FAQ up to date?", answerMd: "Just edit the Google Sheet — the bot reads it live (with a short cache), so there's no separate publishing step.", answerPlain: "Just edit the Google Sheet — the bot reads it live (with a short cache), so there's no separate publishing step." },
      { id: "f3", question: "Where do unanswered questions go?", answerMd: "They're logged to a second sheet tab specifically so you can spot patterns and add new FAQ entries.", answerPlain: "They're logged to a second sheet tab specifically so you can spot patterns and add new FAQ entries." },
      { id: "f4", question: "Does this work in group chats?", answerMd: "It's built for direct messages to the bot; group-chat support needs an extra filter on message type, which the node documentation covers.", answerPlain: "It's built for direct messages to the bot; group-chat support needs an extra filter on message type, which the node documentation covers." },
    ],
  },
};

const graphOverrides: Partial<Record<string, (nodes: NodeDocInput[]) => WorkflowGraph>> = {};

export function getWorkflowDetail(slug: string): WorkflowDetail | null {
  const summary = catalogSeed.find((w) => w.slug === slug);
  const detail = content[slug];
  if (!summary || !detail) return null;

  const graphBuilder = graphOverrides[slug] ?? buildSequentialGraph;

  return {
    ...summary,
    subtitle: detail.subtitle,
    descriptionMd: detail.descriptionMd,
    requirements: requirementsForIntegrations(summary.integrations),
    n8nMinVersion: detail.n8nMinVersion,
    video: null, // No recorded setup videos exist yet — Tab 2 shows an honest "coming soon" state rather than a fabricated URL.
    howToSteps: detail.howToSteps,
    nodes: detail.nodes.map(({ name, type, purpose, credentialsNeeded, notes }) => ({
      name,
      type,
      purpose,
      credentialsNeeded,
      notes,
    })),
    graph: graphBuilder(detail.nodes),
    faqs: detail.faqs,
    changelog: [{ version: "1.0.0", date: summary.publishedAt, notes: "Initial release." }],
  };
}

export function getAllWorkflowDetails(): WorkflowDetail[] {
  return catalogSeed
    .map((w) => getWorkflowDetail(w.slug))
    .filter((detail): detail is WorkflowDetail => detail !== null);
}
