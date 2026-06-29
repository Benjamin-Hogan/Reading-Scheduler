import { db } from "@/lib/db";
import type { Book } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

export interface ReadingStats {
  pagesThisWeek: number;
  booksFinished: number;
  activePlans: number;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function computeReadingStats(): Promise<ReadingStats> {
  const today = new Date();
  const weekStartStr = formatDate(startOfWeek(today));
  const todayStr = formatDate(today);

  const books = await db.books.toArray();
  const activePlans = await db.readingPlans.where("status").equals("active").count();

  const booksFinished = books.filter((b) => b.currentPage >= b.totalPages && b.totalPages > 0).length;

  const planIds = (await db.readingPlans.where("status").equals("active").primaryKeys()) as string[];
  let pagesThisWeek = 0;

  if (planIds.length > 0) {
    const assignments = await db.dailyAssignments
      .filter((a) => planIds.includes(a.planId))
      .toArray();

    const bookMap = new Map(books.map((b) => [b.id, b]));

    for (const assignment of assignments) {
      if (assignment.date < weekStartStr || assignment.date > todayStr) {
        continue;
      }
      const book = bookMap.get(assignment.bookId);
      if (!book) continue;
      pagesThisWeek += estimatePagesReadOnDate(book, assignment);
    }
  }

  return { pagesThisWeek, booksFinished, activePlans };
}

function estimatePagesReadOnDate(
  book: Book,
  assignment: { startPage: number; endPage: number; date: string; pagesToRead: number }
): number {
  const todayStr = formatDate(new Date());
  if (book.currentPage < assignment.startPage) return 0;
  if (assignment.date < todayStr) {
    return assignment.pagesToRead;
  }
  return Math.max(0, Math.min(book.currentPage, assignment.endPage) - assignment.startPage + 1);
}
