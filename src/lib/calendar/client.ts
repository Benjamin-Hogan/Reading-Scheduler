import type { Book, DailyAssignment } from "@/lib/db/schema";
import { buildEventUid } from "./events";

export function getPlanEventUids(
  planId: string,
  assignments: DailyAssignment[]
): string[] {
  return assignments.map((a) => buildEventUid(planId, a.bookId, a.date));
}

export async function deletePlanCalendarEvents(
  planId: string,
  assignments: DailyAssignment[]
): Promise<{ deleted: number; failed: number } | null> {
  const iCalUIDs = getPlanEventUids(planId, assignments);
  if (iCalUIDs.length === 0) return { deleted: 0, failed: 0 };

  const statusRes = await fetch("/api/auth/google/status");
  const status = (await statusRes.json()) as { connected?: boolean };
  if (!status.connected) return null;

  const res = await fetch("/api/calendar/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ iCalUIDs }),
  });

  if (!res.ok) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Failed to delete calendar events");
  }

  return (await res.json()) as { deleted: number; failed: number };
}

export function buildReadingSummary(
  book: Book,
  assignment: DailyAssignment
): string {
  return `Pages ${assignment.startPage}–${assignment.endPage} of ${book.title}`;
}
