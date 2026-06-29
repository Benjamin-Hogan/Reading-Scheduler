import type { DailyAssignment, WeekdayKey } from "@/lib/db/schema";
import type { BookWindow } from "./types";
import { getReadingDaysList } from "./dates";

export function generateAssignmentsForBook(
  planId: string,
  window: BookWindow,
  activeDays: WeekdayKey[]
): Omit<DailyAssignment, "id" | "syncedAt" | "userId">[] {
  const assignments: Omit<DailyAssignment, "id" | "syncedAt" | "userId">[] = [];

  if (window.pagesRemaining <= 0) return assignments;

  const readingDays = getReadingDaysList(window.startDate, window.endDate, activeDays as never);
  if (readingDays.length === 0) return assignments;

  const basePages = Math.floor(window.pagesRemaining / readingDays.length);
  let remainder = window.pagesRemaining % readingDays.length;
  let currentPage = window.currentPage;

  for (const date of readingDays) {
    const pagesToRead = basePages + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    if (pagesToRead <= 0) continue;

    const startPage = currentPage + 1;
    const endPage = currentPage + pagesToRead;
    currentPage = endPage;

    assignments.push({
      planId,
      bookId: window.bookId,
      date,
      startPage,
      endPage,
      pagesToRead,
    });
  }

  return assignments;
}

export function generateAllAssignments(
  planId: string,
  windows: BookWindow[],
  activeDays: WeekdayKey[]
): Omit<DailyAssignment, "id" | "syncedAt" | "userId">[] {
  return windows.flatMap((w) =>
    generateAssignmentsForBook(planId, w, activeDays)
  );
}
