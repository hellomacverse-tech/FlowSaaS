import type { Faq } from "@/types/domain";

export const servicesFaqs: Faq[] = [
  {
    id: "services-faq-1",
    question: "How long does a typical setup take?",
    answerPlain:
      "Most Launch and Growth packages go from discovery call to production in 10–14 days, depending on how many workflows and integrations are in scope. Enterprise engagements are scoped individually after the discovery call.",
    answerMd:
      "Most Launch and Growth packages go from discovery call to production in 10–14 days, depending on how many workflows and integrations are in scope. Enterprise engagements are scoped individually after the discovery call.",
  },
  {
    id: "services-faq-2",
    question: "Do you need access to our servers?",
    answerPlain:
      "For a self-hosted deployment, yes — we'll need SSH or console access to install and harden n8n. For n8n Cloud, we only need an invite to your workspace. Either way, credentials are handled through encrypted storage and removed at project handover unless you keep us on a maintenance plan.",
    answerMd:
      "For a self-hosted deployment, yes — we'll need SSH or console access to install and harden n8n. For n8n Cloud, we only need an invite to your workspace. Either way, credentials are handled through encrypted storage and removed at project handover unless you keep us on a maintenance plan.",
  },
  {
    id: "services-faq-3",
    question: "Who owns the workflows?",
    answerPlain:
      "You do. Everything we build is delivered to your infrastructure and licensed to you without restriction.",
    answerMd:
      "You do. Everything we build is delivered to your infrastructure and licensed to you without restriction.",
  },
  {
    id: "services-faq-4",
    question: "What happens after the 30 days?",
    answerPlain:
      "Your workflows keep running — nothing turns off. If you want us to keep monitoring, patching, and extending them, you can add an optional maintenance plan; otherwise your team takes over with the runbook and recordings from handover.",
    answerMd:
      "Your workflows keep running — nothing turns off. If you want us to keep monitoring, patching, and extending them, you can add an optional maintenance plan; otherwise your team takes over with the runbook and recordings from handover.",
  },
  {
    id: "services-faq-5",
    question: "Can you work under an NDA?",
    answerPlain:
      "Yes — we routinely sign a mutual NDA before the discovery call for clients handling sensitive customer or financial data.",
    answerMd:
      "Yes — we routinely sign a mutual NDA before the discovery call for clients handling sensitive customer or financial data.",
  },
];
