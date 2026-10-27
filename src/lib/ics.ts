interface CalendarEvent {
  title: string;
  description: string;
  startsAt: Date;
  durationMinutes: number;
}

function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** Returns a `data:` URI for a minimal, valid .ics file — no server round trip needed. */
export function buildIcsDataUri(event: CalendarEvent): string {
  const end = new Date(event.startsAt.getTime() + event.durationMinutes * 60_000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FlowSaaS//Booking//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@flowsaas.com`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(event.startsAt)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

export function buildGoogleCalendarUrl(event: CalendarEvent): string {
  const end = new Date(event.startsAt.getTime() + event.durationMinutes * 60_000);
  const format = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    dates: `${format(event.startsAt)}/${format(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
