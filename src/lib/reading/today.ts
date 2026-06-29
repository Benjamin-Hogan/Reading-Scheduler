import { db } from "@/lib/db";
import type { Book, DailyAssignment, ReadingPlan } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

export interface TodayAssignment {
  plan: ReadingPlan;
  book: Book;
  assignment: DailyAssignment;
}

export async function getTodaysReading(date: string = formatDate(new Date())): Promise<TodayAssignment[]> {
  const activePlans = await db.readingPlans.where("status").equals("active").toArray();
  if (activePlans.length === 0) return [];

  const planIds = activePlans.map((p) => p.id);
  const assignments = await db.dailyAssignments
    .where("date")
    .equals(date)
    .filter((a) => planIds.includes(a.planId))
    .toArray();

  if (assignments.length === 0) return [];

  const bookIds = [...new Set(assignments.map((a) => a.bookId))];
  const books = await db.books.bulkGet(bookIds);
  const bookMap = new Map(
    books.filter((b): b is Book => b !== undefined).map((b) => [b.id, b])
  );
  const planMap = new Map(activePlans.map((p) => [p.id, p]));

  const results: TodayAssignment[] = [];
  for (const assignment of assignments) {
    const book = bookMap.get(assignment.bookId);
    const plan = planMap.get(assignment.planId);
    if (book && plan) {
      results.push({ plan, book, assignment });
    }
  }

  return results.sort((a, b) => a.plan.name.localeCompare(b.plan.name));
}
