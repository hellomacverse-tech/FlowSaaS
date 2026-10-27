import type { Faq } from "@/types/domain";

export const pricingFaqs: Faq[] = [
  {
    id: "pricing-faq-1",
    question: "Can I switch plans?",
    answerPlain:
      "Yes. Upgrade, downgrade, or switch between monthly and annual billing any time from your dashboard's billing page — changes are prorated by Stripe automatically.",
    answerMd:
      "Yes. Upgrade, downgrade, or switch between monthly and annual billing any time from your dashboard's billing page — changes are prorated by Stripe automatically.",
  },
  {
    id: "pricing-faq-2",
    question: "Do credits roll over?",
    answerPlain: "No, they reset monthly; credit packs never expire.",
    answerMd: "No, they reset monthly; credit packs never expire.",
  },
  {
    id: "pricing-faq-3",
    question: "Do you offer team pricing?",
    answerPlain:
      "Yes — Enterprise plans cover multi-seat access, a private workflow library, and volume Micro-SaaS credits. Contact us for a quote based on your team size.",
    answerMd:
      "Yes — Enterprise plans cover multi-seat access, a private workflow library, and volume Micro-SaaS credits. Contact us for a quote based on your team size.",
  },
];
