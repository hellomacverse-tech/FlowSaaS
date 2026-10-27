"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { BookingCalendar } from "./BookingCalendar";
import { QuoteForm } from "./QuoteForm";

type Tab = "book" | "quote";

export function BookingQuoteWidget() {
  const [tab, setTab] = useState<Tab>("book");

  return (
    <Card className="p-6 sm:p-8">
      <div role="tablist" aria-label="Book a call or request a quote" className="flex gap-1 border-b border-line/70">
        <button
          role="tab"
          aria-selected={tab === "book"}
          onClick={() => setTab("book")}
          className={`px-4 py-2.5 text-sm font-semibold ${
            tab === "book" ? "border-b-2 border-violet-500 text-ink" : "text-muted hover:text-ink-2"
          }`}
        >
          Book a Call
        </button>
        <button
          role="tab"
          aria-selected={tab === "quote"}
          onClick={() => setTab("quote")}
          className={`px-4 py-2.5 text-sm font-semibold ${
            tab === "quote" ? "border-b-2 border-violet-500 text-ink" : "text-muted hover:text-ink-2"
          }`}
        >
          Request a Quote
        </button>
      </div>

      <div className="pt-6">{tab === "book" ? <BookingCalendar /> : <QuoteForm />}</div>
    </Card>
  );
}
