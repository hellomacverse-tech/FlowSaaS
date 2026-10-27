"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          id="main-content"
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1>FlowSaaS hit a snag loading this page.</h1>
          <p>Try reloading. If it keeps happening, contact support.</p>
          <button onClick={reset} style={{ marginTop: "1.5rem" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
