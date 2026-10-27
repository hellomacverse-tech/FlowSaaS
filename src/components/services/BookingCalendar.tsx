"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/cn";
import { buildIcsDataUri, buildGoogleCalendarUrl } from "@/lib/ics";
import { Turnstile } from "@/components/security/Turnstile";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const COMMON_TIMEZONES = [
  "UTC",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Singapore",
  "Asia/Kolkata",
  "Australia/Sydney",
];

interface Slot {
  id: string;
  startsAt: string; // ISO
}

type Step = "pick-day" | "pick-slot" | "details" | "success";

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}
/** Mon-first weekday index: Monday = 0 … Sunday = 6. */
function mondayFirstWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}
function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function BookingCalendar() {
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [step, setStep] = useState<Step>("pick-day");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    if (!selectedDay) return;
    setSlots(null);
    const from = new Date(selectedDay);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);

    fetch(`/api/booking-slots?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((res) => res.json())
      .then((json: { ok: boolean; slots?: Slot[] }) => {
        setSlots(json.ok ? (json.slots ?? []) : []);
      })
      .catch(() => setSlots([]));
  }, [selectedDay]);

  const leadingBlanks = mondayFirstWeekday(startOfMonth(monthCursor));
  const totalDays = daysInMonth(monthCursor);

  function selectDay(day: number) {
    const date = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day);
    if (date < today) return;
    setSelectedDay(date);
    setSelectedSlot(null);
    setStep("pick-slot");
  }

  async function confirmBooking(formValues: {
    fullName: string;
    workEmail: string;
    company: string;
    notes: string;
    turnstileToken: string;
  }) {
    if (!selectedSlot) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          timezone,
          fullName: formValues.fullName,
          workEmail: formValues.workEmail,
          company: formValues.company,
          notes: formValues.notes,
          honeypot: "",
          turnstileToken: formValues.turnstileToken,
        }),
      });
      const json = await response.json();

      if (response.status === 409 || json.error === "slot-taken") {
        setErrorMessage("That time was just booked. Please pick another slot.");
        setStep("pick-slot");
        setSlots((prev) => prev?.filter((s) => s.id !== selectedSlot.id) ?? null);
        return;
      }
      if (!response.ok || !json.ok) throw new Error("Booking failed");

      setStep("success");
    } catch {
      setErrorMessage("Something went wrong confirming your booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "success" && selectedSlot) {
    const startsAt = new Date(selectedSlot.startsAt);
    const dateLabel = startsAt.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: timezone,
    });
    const event = {
      title: "FlowSaaS Discovery Call",
      description: "45-min Discovery Call with the FlowSaaS team.",
      startsAt,
      durationMinutes: 45,
    };

    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line/70 bg-white p-8 text-center">
        <CheckCircle2 aria-hidden="true" size={32} className="text-teal-700" />
        <p className="text-sm font-semibold text-ink">45-min Discovery Call · Google Meet</p>
        <p className="text-sm text-ink-2">
          {dateLabel} ({timezone})
        </p>
        <div className="mt-3 flex gap-3">
          <a
            href={buildIcsDataUri(event)}
            download="flowsaas-discovery-call.ics"
            className="text-sm font-medium text-violet-600 hover:underline"
          >
            Add to calendar (.ics)
          </a>
          <a
            href={buildGoogleCalendarUrl(event)}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-violet-600 hover:underline"
          >
            Google Calendar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            aria-label="Previous month"
            className="rounded-lg p-1.5 hover:bg-surface"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <p className="text-sm font-semibold text-ink">
            {monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
          <button
            type="button"
            onClick={() => setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            aria-label="Next month"
            className="rounded-lg p-1.5 hover:bg-surface"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>

        <div role="grid" aria-label="Pick a day" className="grid grid-cols-7 gap-1 text-center text-xs">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
            <div key={label} className="py-1 font-medium text-muted">
              {label}
            </div>
          ))}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
            const date = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day);
            const isPast = date < today;
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const disabled = isPast || isWeekend;
            const isToday = isSameDay(date, today);
            const isSelected = selectedDay ? isSameDay(date, selectedDay) : false;

            return (
              <button
                key={day}
                type="button"
                role="gridcell"
                disabled={disabled}
                onClick={() => selectDay(day)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
                  disabled && "cursor-not-allowed text-muted/50",
                  !disabled && "font-semibold text-ink hover:bg-surface",
                  isSelected && "bg-ink text-white hover:bg-ink",
                  isToday && !isSelected && "ring-1 ring-violet-300",
                )}
              >
                {day}
                {!disabled ? (
                  <span
                    aria-hidden="true"
                    className={cn("h-1 w-1 rounded-full", isSelected ? "bg-white" : "bg-teal-500")}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <label htmlFor="booking-timezone" className="mt-4 block text-xs text-muted">
          Timezone
        </label>
        <select
          id="booking-timezone"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          className="mt-1 w-full rounded-lg border border-line/70 px-2.5 py-1.5 text-sm"
        >
          {[timezone, ...COMMON_TIMEZONES.filter((tz) => tz !== timezone)].map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      <div>
        {step === "pick-slot" && selectedDay ? (
          <div>
            <p className="text-sm font-semibold text-ink">
              {selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            {errorMessage ? <p className="mt-2 text-sm font-medium text-danger">{errorMessage}</p> : null}
            {slots === null ? (
              <p className="mt-3 text-sm text-muted">Loading available times…</p>
            ) : slots.length === 0 ? (
              <p className="mt-3 text-sm text-muted">No open slots this day — try another.</p>
            ) : (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    aria-pressed={selectedSlot?.id === slot.id}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setStep("details");
                    }}
                    className="rounded-lg border border-line/70 px-2 py-2 text-sm hover:bg-surface"
                  >
                    {new Date(slot.startsAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: timezone,
                    })}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {step === "details" && selectedSlot ? (
          <BookingDetailsForm
            summary={`45-min Discovery Call · Google Meet · ${new Date(selectedSlot.startsAt).toLocaleString(
              "en-US",
              { dateStyle: "full", timeStyle: "short", timeZone: timezone },
            )} (${timezone})`}
            submitting={submitting}
            errorMessage={errorMessage}
            onBack={() => setStep("pick-slot")}
            onSubmit={confirmBooking}
          />
        ) : null}

        {step === "pick-day" ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">
            Pick a day to see open times.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BookingDetailsForm({
  summary,
  submitting,
  errorMessage,
  onBack,
  onSubmit,
}: {
  summary: string;
  submitting: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onSubmit: (values: { fullName: string; workEmail: string; company: string; notes: string; turnstileToken: string }) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ fullName, workEmail, company, notes, turnstileToken });
      }}
      className="flex flex-col gap-4"
    >
      <div className="rounded-xl bg-surface p-3 text-sm text-ink-2">{summary}</div>
      <Input label="Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <Input
        label="Work email"
        type="email"
        required
        value={workEmail}
        onChange={(e) => setWorkEmail(e.target.value)}
      />
      <Input label="Company" required value={company} onChange={(e) => setCompany(e.target.value)} />
      <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={setTurnstileToken} />
      {errorMessage ? <p className="text-sm font-medium text-danger">{errorMessage}</p> : null}
      <div className="flex gap-2">
        <Button type="button" variant="secondary-outline" size="sm" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" size="sm" loading={submitting} disabled={!turnstileToken}>
          Confirm booking
        </Button>
      </div>
    </form>
  );
}
