import type { LayoutMode, WeekdayKey } from "@/lib/db/schema";
import type { BookInput, BookWindow } from "./types";
import {
  addReadingDays,
  countReadingDays,
  getReadingDaysList,
  nextReadingDay,
} from "./dates";

export function computeBookWindows(
  books: BookInput[],
  startDate: string,
  targetEndDate: string,
  layoutMode: LayoutMode,
  activeDays: WeekdayKey[],
  pagesPerDayOverride?: number | null
): BookWindow[] {
  const sorted = [...books].sort((a, b) => a.sortOrder - b.sortOrder);

  if (layoutMode === "parallel") {
    return sorted.map((book) => {
      const pagesRemaining = Math.max(0, book.totalPages - book.currentPage);
      const readingDays = countReadingDays(startDate, targetEndDate, activeDays);
      const pagesPerDay =
        pagesPerDayOverride ??
        (readingDays > 0 ? Math.ceil(pagesRemaining / readingDays) : pagesRemaining);

      return {
        bookId: book.bookId,
        title: book.title,
        sortOrder: book.sortOrder,
        startDate,
        endDate: targetEndDate,
        totalPages: book.totalPages,
        currentPage: book.currentPage,
        pagesRemaining,
        readingDays,
        pagesPerDay,
      };
    });
  }

  // sequential and custom order: queue books back-to-back within the plan window
  const totalPlanDays = countReadingDays(startDate, targetEndDate, activeDays);
  const booksWithRemaining = sorted.map((book) => ({
    book,
    pagesRemaining: Math.max(0, book.totalPages - book.currentPage),
  }));
  const activeBooks = booksWithRemaining.filter((b) => b.pagesRemaining > 0);

  const windows: BookWindow[] = [];
  let currentStart = startDate;
  let daysBudgetRemaining = totalPlanDays;
  let activeBookIndex = 0;

  for (const { book, pagesRemaining } of booksWithRemaining) {
    let endDate: string;
    let readingDays: number;
    let pagesPerDay: number;

    if (pagesRemaining === 0) {
      endDate = currentStart;
      readingDays = 0;
      pagesPerDay = 0;
    } else if (pagesPerDayOverride) {
      pagesPerDay = pagesPerDayOverride;
      readingDays = Math.ceil(pagesRemaining / pagesPerDay);
      endDate = addReadingDays(currentStart, readingDays, activeDays);
    } else if (totalPlanDays === 0) {
      pagesPerDay = pagesRemaining;
      readingDays = 0;
      endDate = currentStart;
    } else {
      const remainingPages = activeBooks
        .slice(activeBookIndex)
        .reduce((sum, b) => sum + b.pagesRemaining, 0);
      const isLastActiveBook = activeBookIndex === activeBooks.length - 1;

      readingDays = isLastActiveBook
        ? Math.max(1, daysBudgetRemaining)
        : Math.max(
            1,
            Math.min(
              daysBudgetRemaining,
              Math.round((pagesRemaining / remainingPages) * daysBudgetRemaining)
            )
          );

      pagesPerDay = Math.ceil(pagesRemaining / readingDays);
      endDate = addReadingDays(currentStart, readingDays, activeDays);
      daysBudgetRemaining = Math.max(0, daysBudgetRemaining - readingDays);
      activeBookIndex++;
    }

    windows.push({
      bookId: book.bookId,
      title: book.title,
      sortOrder: book.sortOrder,
      startDate: currentStart,
      endDate,
      totalPages: book.totalPages,
      currentPage: book.currentPage,
      pagesRemaining,
      readingDays,
      pagesPerDay,
    });

    if (pagesRemaining > 0) {
      currentStart = nextReadingDay(endDate, activeDays);
    }
  }

  return windows;
}

export { getReadingDaysList } from "./dates";
