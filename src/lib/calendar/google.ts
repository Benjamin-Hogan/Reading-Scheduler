import type { Book, DailyAssignment } from "@/lib/db/schema";
import {
  buildEventDescription,
  buildEventTitle,
  buildEventUid,
  parseReadTime,
} from "./events";

export interface GoogleCalendarEvent {
  iCalUID: string;
  summary: string;
  description: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
}

function formatLocalDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const sec = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}:${sec}`;
}

export function assignmentToGoogleEvent(
  assignment: DailyAssignment,
  book: Book,
  planId: string,
  preferredReadTime: string,
  timezone: string
): GoogleCalendarEvent {
  const { hours, minutes } = parseReadTime(preferredReadTime);
  const startDateTime = `${assignment.date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  const start = new Date(startDateTime);
  const end = new Date(start.getTime() + 30 * 60 * 1000);

  return {
    iCalUID: buildEventUid(planId, assignment.bookId, assignment.date),
    summary: buildEventTitle(assignment, book),
    description: buildEventDescription(assignment, book),
    start: { dateTime: startDateTime, timeZone: timezone },
    end: { dateTime: formatLocalDateTime(end), timeZone: timezone },
  };
}

export class GoogleCalendarApiError extends Error {
  readonly code?: number;
  readonly reason?: string;
  readonly activationUrl?: string;

  constructor(
    message: string,
    options?: { code?: number; reason?: string; activationUrl?: string }
  ) {
    super(message);
    this.name = "GoogleCalendarApiError";
    this.code = options?.code;
    this.reason = options?.reason;
    this.activationUrl = options?.activationUrl;
  }
}

export function parseGoogleCalendarError(responseText: string): GoogleCalendarApiError {
  try {
    const parsed = JSON.parse(responseText) as {
      error?: {
        code?: number;
        message?: string;
        errors?: Array<{ reason?: string }>;
        details?: Array<{
          reason?: string;
          metadata?: { activationUrl?: string };
        }>;
      };
    };
    const error = parsed.error;
    if (!error) {
      return new GoogleCalendarApiError(`Calendar API error: ${responseText}`);
    }

    const reason = error.errors?.[0]?.reason ?? error.details?.find((d) => d.reason)?.reason;
    const activationUrl = error.details?.find((d) => d.metadata?.activationUrl)?.metadata
      ?.activationUrl;

    if (
      reason === "accessNotConfigured" ||
      error.details?.some((d) => d.reason === "SERVICE_DISABLED")
    ) {
      return new GoogleCalendarApiError(
        "Google Calendar API is not enabled for your Cloud project. Enable it in Google Cloud Console, wait a few minutes, then try exporting again.",
        {
          code: error.code,
          reason: "SERVICE_DISABLED",
          activationUrl:
            activationUrl ??
            "https://console.cloud.google.com/apis/library/calendar-json.googleapis.com",
        }
      );
    }

    if (error.code === 401) {
      return new GoogleCalendarApiError(
        "Google session expired. Reconnect Google Calendar in Settings.",
        { code: 401, reason: "UNAUTHENTICATED" }
      );
    }

    return new GoogleCalendarApiError(
      error.message ?? `Calendar API error (${error.code})`,
      { code: error.code, reason, activationUrl }
    );
  } catch {
    return new GoogleCalendarApiError(`Calendar API error: ${responseText}`);
  }
}

function isFatalCalendarError(error: unknown): error is GoogleCalendarApiError {
  return (
    error instanceof GoogleCalendarApiError &&
    (error.reason === "SERVICE_DISABLED" || error.code === 401)
  );
}

async function readCalendarApiError(response: Response): Promise<GoogleCalendarApiError> {
  const err = await response.text();
  return parseGoogleCalendarError(err);
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh access token");
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function findEventByICalUid(
  accessToken: string,
  calendarId: string,
  iCalUID: string
): Promise<string | null> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );
  url.searchParams.set("iCalUID", iCalUID);
  url.searchParams.set("maxResults", "1");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401 || res.status === 403) {
    throw await readCalendarApiError(res);
  }
  if (!res.ok) {
    throw await readCalendarApiError(res);
  }

  const data = (await res.json()) as { items?: Array<{ id: string }> };
  return data.items?.[0]?.id ?? null;
}

export async function upsertGoogleCalendarEvent(
  accessToken: string,
  event: GoogleCalendarEvent
): Promise<void> {
  const calendarId = "primary";
  const eventPayload = {
    summary: event.summary,
    description: event.description,
    start: event.start,
    end: event.end,
    iCalUID: event.iCalUID,
  };

  const existingId = await findEventByICalUid(accessToken, calendarId, event.iCalUID);
  const url = existingId
    ? `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(existingId)}`
    : `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  const res = await fetch(url, {
    method: existingId ? "PUT" : "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventPayload),
  });

  if (!res.ok) {
    throw await readCalendarApiError(res);
  }
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  iCalUID: string
): Promise<boolean> {
  const calendarId = "primary";
  const existingId = await findEventByICalUid(accessToken, calendarId, iCalUID);
  if (!existingId) return false;

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(existingId)}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401 || res.status === 403) {
    throw await readCalendarApiError(res);
  }
  if (res.status === 404 || res.status === 410) return false;
  if (!res.ok) {
    throw await readCalendarApiError(res);
  }
  return true;
}

export async function batchDeleteGoogleCalendarEvents(
  accessToken: string,
  iCalUIDs: string[]
): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;

  for (let i = 0; i < iCalUIDs.length; i++) {
    try {
      const ok = await deleteGoogleCalendarEvent(accessToken, iCalUIDs[i]);
      if (ok) deleted++;
    } catch (e) {
      failed++;
      if (isFatalCalendarError(e)) {
        failed += iCalUIDs.length - i - 1;
        break;
      }
    }
    if ((i + 1) % 10 === 0) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return { deleted, failed };
}

export async function batchExportToGoogleCalendar(
  accessToken: string,
  events: GoogleCalendarEvent[],
  onProgress?: (done: number, total: number) => void
): Promise<{ success: number; failed: number; errors: string[]; activationUrl?: string }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  let activationUrl: string | undefined;

  for (let i = 0; i < events.length; i++) {
    try {
      await upsertGoogleCalendarEvent(accessToken, events[i]);
      success++;
    } catch (e) {
      failed++;
      errors.push(e instanceof Error ? e.message : "Unknown error");
      if (e instanceof GoogleCalendarApiError && e.activationUrl) {
        activationUrl = e.activationUrl;
      }
      if (isFatalCalendarError(e)) {
        failed += events.length - i - 1;
        break;
      }
    }
    onProgress?.(i + 1, events.length);

    if ((i + 1) % 10 === 0) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return { success, failed, errors, activationUrl };
}
