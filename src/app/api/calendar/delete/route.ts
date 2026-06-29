import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  batchDeleteGoogleCalendarEvents,
  refreshAccessToken,
} from "@/lib/calendar/google";
import { getGoogleAuthCookieOptions } from "@/lib/google/oauth";

interface DeleteBody {
  iCalUIDs: string[];
}

async function getAccessToken(request: NextRequest): Promise<string | null> {
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
      return null;
    }
  }

  return accessToken ?? null;
}

export async function POST(request: NextRequest) {
  const accessToken = await getAccessToken(request);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Not connected to Google Calendar" },
      { status: 401 }
    );
  }

  const body = (await request.json()) as DeleteBody;
  const result = await batchDeleteGoogleCalendarEvents(accessToken, body.iCalUIDs);

  return NextResponse.json(result);
}
