import { createEvents, type EventAttributes } from "ics";
import type { Book, DailyAssignment } from "@/lib/db/schema";
import {
  buildEventDescription,
  buildEventTitle,
  buildEventUid,
  parseReadTime,
} from "./events";

export interface IcsExportOptions {
  assignments: DailyAssignment[];
  books: Book[];
  planId: string;
  preferredReadTime: string;
  timezone?: string;
}

export function buildIcsEvents(options: IcsExportOptions): EventAttributes[] {
  const bookMap = new Map(options.books.map((b) => [b.id, b]));
  const { hours, minutes } = parseReadTime(options.preferredReadTime);

  const events: EventAttributes[] = [];

  for (const assignment of options.assignments) {
    const book = bookMap.get(assignment.bookId);
    if (!book) continue;

    const [year, month, day] = assignment.date.split("-").map(Number);

    events.push({
      uid: buildEventUid(options.planId, assignment.bookId, assignment.date),
      start: [year, month, day, hours, minutes],
      duration: { minutes: 30 },
      title: buildEventTitle(assignment, book),
      description: buildEventDescription(assignment, book),
      status: "CONFIRMED",
      busyStatus: "BUSY",
    });
  }

  return events;
}

export async function generateIcsFile(options: IcsExportOptions): Promise<string> {
  const events = buildIcsEvents(options);
  const { error, value } = createEvents(events);
  if (error || !value) {
    throw error ?? new Error("Failed to generate ICS file");
  }
  return value;
}

export function downloadIcsFile(icsContent: string, planName: string): void {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${planName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-reading-plan.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
