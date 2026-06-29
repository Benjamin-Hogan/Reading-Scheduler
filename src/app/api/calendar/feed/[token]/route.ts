import { NextRequest, NextResponse } from "next/server";
import {
  generateFeedIcs,
  normalizeFeedToken,
} from "@/lib/calendar/feed";
import {
  deleteCalendarFeed,
  getCalendarFeed,
} from "@/lib/calendar/feed-store";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { token: rawToken } = await context.params;
  const token = normalizeFeedToken(rawToken);

  const payload = await getCalendarFeed(token);
  if (!payload) {
    return new NextResponse("Calendar feed not found", { status: 404 });
  }

  const ics = await generateFeedIcs(payload);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Content-Disposition": `inline; filename="${slugify(payload.planName)}.ics"`,
    },
  });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { token: rawToken } = await context.params;
  const token = normalizeFeedToken(rawToken);

  const deleted = await deleteCalendarFeed(token);
  if (!deleted) {
    return NextResponse.json({ error: "Calendar feed not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}

function slugify(value: string): string {
  return value.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "reading-plan";
}
