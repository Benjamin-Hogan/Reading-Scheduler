import { NextRequest, NextResponse } from "next/server";
import type { Book, DailyAssignment } from "@/lib/db/schema";
import {
  buildFeedUrl,
  buildWebcalUrl,
  getRequestBaseUrl,
} from "@/lib/calendar/feed";
import type { CalendarFeedPayload, PublishFeedRequest } from "@/lib/calendar/feed-types";
import {
  createFeedToken,
  getCalendarFeed,
  saveCalendarFeed,
} from "@/lib/calendar/feed-store";

function slimBooks(books: Book[]) {
  return books.map((book) => ({ id: book.id, title: book.title }));
}

function validatePublishBody(body: PublishFeedRequest): string | null {
  if (!body.planId || !body.planName) return "planId and planName are required";
  if (!Array.isArray(body.assignments) || !Array.isArray(body.books)) {
    return "assignments and books are required";
  }
  if (!body.preferredReadTime) return "preferredReadTime is required";
  return null;
}

export async function POST(request: NextRequest) {
  let body: PublishFeedRequest;
  try {
    body = (await request.json()) as PublishFeedRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validationError = validatePublishBody(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const token = body.token?.trim() || createFeedToken();
  const existing = body.token ? await getCalendarFeed(token) : null;
  const sequence = (existing?.sequence ?? 0) + 1;

  const payload: CalendarFeedPayload = {
    version: 1,
    updatedAt: new Date().toISOString(),
    sequence,
    planId: body.planId,
    planName: body.planName,
    preferredReadTime: body.preferredReadTime,
    timezone: body.timezone ?? "UTC",
    assignments: body.assignments as DailyAssignment[],
    books: slimBooks(body.books as Book[]),
  };

  await saveCalendarFeed(token, payload);

  const baseUrl = getRequestBaseUrl(request);
  const feedUrl = buildFeedUrl(baseUrl, token);

  return NextResponse.json({
    token,
    feedUrl,
    webcalUrl: buildWebcalUrl(feedUrl),
    updatedAt: payload.updatedAt,
  });
}
