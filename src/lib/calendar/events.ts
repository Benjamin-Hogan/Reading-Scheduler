import type { Book, DailyAssignment } from "@/lib/db/schema";

export interface CalendarEventInput {
  assignment: DailyAssignment;
  book: Book;
  preferredReadTime: string;
  timezone: string;
  planId: string;
}

export function buildEventUid(planId: string, bookId: string, date: string): string {
  const raw = `${planId}-${bookId}-${date}@reading-scheduler.app`;
  return raw.replace(/[^a-zA-Z0-9-@.]/g, "").toLowerCase().slice(0, 120);
}

export function parseReadTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(":").map(Number);
  return { hours: h || 19, minutes: m || 0 };
}

export function buildEventTitle(assignment: DailyAssignment, book: Book): string {
  return `Read ${assignment.pagesToRead} pp — ${book.title}`;
}

export function buildEventDescription(assignment: DailyAssignment, book: Book): string {
  return `Pages ${assignment.startPage}–${assignment.endPage} of ${book.title}\n\nPlanned with Reading Scheduler`;
}

export function buildGoogleCalendarUrl(
  assignment: DailyAssignment,
  book: Book,
  preferredReadTime: string
): string {
  const { hours, minutes } = parseReadTime(preferredReadTime);
  const start = new Date(`${assignment.date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: buildEventTitle(assignment, book),
    dates: `${fmt(start)}/${fmt(end)}`,
    details: buildEventDescription(assignment, book),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
