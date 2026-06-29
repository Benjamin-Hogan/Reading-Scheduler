import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Book, DailyAssignment } from "@/lib/db/schema";
import {
  assignmentToGoogleEvent,
  batchExportToGoogleCalendar,
  refreshAccessToken,
} from "@/lib/calendar/google";
import { getGoogleAuthCookieOptions } from "@/lib/google/oauth";

interface ExportBody {
  planId: string;
  planName: string;
  preferredReadTime: string;
  timezone: string;
  assignments: DailyAssignment[];
  books: Book[];
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("google_access_token")?.value;
  const refreshToken = cookieStore.get("google_refresh_token")?.value;

  if (!accessToken && refreshToken) {
    try {
      accessToken = await refreshAccessToken(refreshToken);
      cookieStore.set(
        "google_access_token",
        accessToken,
        getGoogleAuthCookieOptions(request, 3600)
      );
    } catch {
      return NextResponse.json(
        { error: "Session expired. Please reconnect Google Calendar." },
        { status: 401 }
      );
    }
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "Not connected to Google Calendar" },
      { status: 401 }
    );
  }

  const body = (await request.json()) as ExportBody;

  const events = body.assignments.map((a) => {
    const book = body.books.find((b) => b.id === a.bookId);
    if (!book) throw new Error(`Book not found: ${a.bookId}`);
    return assignmentToGoogleEvent(
      a,
      book,
      body.planId,
      body.preferredReadTime,
      body.timezone
    );
  });

  const result = await batchExportToGoogleCalendar(accessToken, events);

  return NextResponse.json({
    planName: body.planName,
    ...result,
  });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("google_access_token");
  cookieStore.delete("google_refresh_token");
  return NextResponse.json({ disconnected: true });
}
