import { ImageResponse } from "next/og";
import { catalogSeed } from "@/data/catalog-seed";

const size = { width: 1200, height: 630 };

export function generateStaticParams() {
  return catalogSeed.map((workflow) => ({ slug: workflow.slug }));
}

/**
 * Stable, un-hashed URL (/og/workflows/{slug}) so page metadata and JSON-LD can
 * reference it reliably. The `opengraph-image` file convention appends a
 * content hash to its URL, which broke both references.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const workflow = catalogSeed.find((w) => w.slug === slug);
  const title = workflow?.title ?? "FlowSaaS Workflow";
  const roi = workflow ? `Saves ${workflow.roiHoursPerWeek} hrs/week` : "";
  const price = workflow ? `$${(workflow.price.amountCents / 100).toFixed(0)}` : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #F8FAFC 0%, #FFFFFF 60%, #F5F3FF 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #14b8a6, #8b5cf6)",
            }}
          />
          <span style={{ fontSize: 28, fontWeight: 800, color: "#0F172A" }}>FlowSaaS</span>
        </div>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 800, color: "#0F172A", lineHeight: 1.1, maxWidth: 900 }}>
          {title}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 32 }}>
          {roi ? (
            <div
              style={{
                display: "flex",
                padding: "10px 20px",
                borderRadius: 999,
                background: "#F0FDFA",
                color: "#0F766E",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {roi}
            </div>
          ) : null}
          {price ? (
            <div
              style={{
                display: "flex",
                padding: "10px 20px",
                borderRadius: 999,
                background: "#FFFFFF",
                color: "#0F172A",
                fontSize: 22,
                fontWeight: 700,
                border: "1px solid #E2E8F0",
              }}
            >
              {price}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size },
  );
}
