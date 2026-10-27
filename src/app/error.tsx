"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry.captureException wiring lands with the monitoring setup in
    // Phase 8 (Section 15.1). For now this keeps a readable trace in logs.
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-h3 text-ink">Something went wrong.</h1>
      <p className="mt-3 text-ink-2">
        This step didn&apos;t complete. Try again — if it keeps happening, contact support and mention what
        you were doing.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </main>
  );
}
