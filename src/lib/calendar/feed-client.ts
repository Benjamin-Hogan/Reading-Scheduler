import type { Book, DailyAssignment, ReadingPlan } from "@/lib/db/schema";
import type { PublishFeedResponse } from "./feed-types";
import { db } from "@/lib/db";

export interface PublishCalendarFeedInput {
  plan: ReadingPlan;
  books: Book[];
  assignments: DailyAssignment[];
  timezone: string;
  token?: string | null;
}

export async function publishCalendarFeed(
  input: PublishCalendarFeedInput
): Promise<PublishFeedResponse> {
  const res = await fetch("/api/calendar/feed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planId: input.plan.id,
      planName: input.plan.name,
      preferredReadTime: input.plan.preferredReadTime,
      timezone: input.timezone,
      assignments: input.assignments,
      books: input.books,
      token: input.token ?? input.plan.calendarFeedToken ?? null,
    }),
  });

  const data = (await res.json()) as PublishFeedResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Failed to publish calendar feed");
  }

  return data;
}

export async function revokeCalendarFeed(token: string): Promise<void> {
  const res = await fetch(`/api/calendar/feed/${token}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error ?? "Failed to revoke calendar feed");
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function syncPlanCalendarFeed(
  planId: string
): Promise<PublishFeedResponse | null> {
  const plan = await db.readingPlans.get(planId);
  if (!plan?.calendarFeedToken) return null;

  const [assignments, planBooks, settingsRows] = await Promise.all([
    db.dailyAssignments.where("planId").equals(planId).sortBy("date"),
    db.planBooks.where("planId").equals(planId).sortBy("sortOrder"),
    db.settings.toArray(),
  ]);

  const books = (
    await db.books.bulkGet(planBooks.map((pb) => pb.bookId))
  ).filter((b): b is Book => b !== undefined);

  return publishCalendarFeed({
    plan,
    books,
    assignments,
    timezone: settingsRows[0]?.timezone ?? "UTC",
    token: plan.calendarFeedToken,
  });
}
