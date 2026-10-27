/**
 * Renders a single `@graph` JSON-LD payload as a `<script>` tag. `<` is
 * escaped so nothing in the data (a workflow title, a review body, etc.)
 * can break out of the script context — this is the one place raw JSON
 * reaches the page, so every caller must go through this component rather
 * than hand-rolling a `<script dangerouslySetInnerHTML>` elsewhere.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // JSON.stringify'd and `<`-escaped above, so this is never raw user HTML.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
