import type { NextRequest } from "next/server";
import type { CalendarFeedPayload } from "./feed-types";
import { generateIcsFile } from "./ics";

export function normalizeFeedToken(raw: string): string {
  return raw.replace(/\.ics$/i, "");
}

export function getRequestBaseUrl(request: NextRequest): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export function buildFeedUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/api/calendar/feed/${token}`;
}

export function buildWebcalUrl(feedUrl: string): string {
  return feedUrl.replace(/^https?:\/\//i, "webcal://");
}

export async function generateFeedIcs(payload: CalendarFeedPayload): Promise<string> {
  const books = payload.books.map((book) => ({
    id: book.id,
    title: book.title,
    authors: [] as string[],
    totalPages: 0,
    currentPage: 0,
    source: "manual" as const,
    createdAt: payload.updatedAt,
  }));

  return generateIcsFile({
    assignments: payload.assignments,
    books,
    planId: payload.planId,
    preferredReadTime: payload.preferredReadTime,
    timezone: payload.timezone,
    calName: payload.planName,
    sequence: payload.sequence,
  });
}
