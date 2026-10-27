import { describe, expect, it } from "vitest";
import { buildWorkflowGraph } from "@/lib/schema/workflow";
import { getWorkflowDetail } from "@/data/workflow-details";

describe("buildWorkflowGraph", () => {
  it("omits aggregateRating when the workflow has zero verified reviews", () => {
    const workflow = getWorkflowDetail("facebook-messenger-crm-google-sheets");
    expect(workflow).not.toBeNull();
    expect(workflow!.rating).toBeNull();

    const { softwareNode } = buildWorkflowGraph(workflow!);
    expect(softwareNode).not.toHaveProperty("aggregateRating");
  });

  it("includes aggregateRating once the workflow has a rating", () => {
    const workflow = getWorkflowDetail("facebook-messenger-crm-google-sheets")!;
    const rated = { ...workflow, rating: { average: 4.8, count: 27 } };

    const { softwareNode } = buildWorkflowGraph(rated);
    expect(softwareNode).toHaveProperty("aggregateRating");
    expect((softwareNode.aggregateRating as { ratingValue: string }).ratingValue).toBe("4.8");
  });

  it("produces one HowToStep per howToStep and one Question per FAQ", () => {
    const workflow = getWorkflowDetail("facebook-messenger-crm-google-sheets")!;
    const { howToNode, faqNode } = buildWorkflowGraph(workflow);

    expect((howToNode.step as unknown[]).length).toBe(workflow.howToSteps.length);
    expect((faqNode.mainEntity as unknown[]).length).toBe(workflow.faqs.length);
  });

  it("builds a valid detail object for every launch workflow", () => {
    const slugs = [
      "facebook-messenger-crm-google-sheets",
      "messenger-ai-sales-agent-orders",
      "facebook-comment-to-messenger-lead-tagger",
      "google-maps-lead-scraper-airtable",
      "website-form-lead-enrichment-alerts",
      "multi-channel-content-distributor",
      "rss-to-ai-social-scheduler",
      "shopify-order-telegram-fulfilment-sheet",
      "abandoned-cart-recovery-messenger-email",
      "shopify-low-stock-supplier-reorder",
      "ai-support-ticket-triage",
      "telegram-ai-knowledge-bot-sheets",
    ];

    for (const slug of slugs) {
      const workflow = getWorkflowDetail(slug);
      expect(workflow, `expected detail content for ${slug}`).not.toBeNull();
      expect(workflow!.nodes.length).toBeGreaterThan(0);
      expect(workflow!.howToSteps.length).toBeGreaterThan(0);
      expect(workflow!.faqs.length).toBeGreaterThan(0);
      expect(workflow!.graph.nodes.length).toBe(workflow!.nodes.length);
      expect(workflow!.graph.edges.length).toBe(workflow!.nodes.length - 1);
    }
  });
});
