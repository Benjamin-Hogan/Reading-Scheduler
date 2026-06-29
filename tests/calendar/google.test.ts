import { describe, it, expect } from "vitest";
import {
  assignmentToGoogleEvent,
  parseGoogleCalendarError,
} from "@/lib/calendar/google";
import { buildEventUid } from "@/lib/calendar/events";
import type { Book, DailyAssignment } from "@/lib/db/schema";

const book: Book = {
  id: "book-1",
  title: "Test Book",
  authors: ["Test Author"],
  source: "manual",
  totalPages: 200,
  currentPage: 0,
  createdAt: "2026-01-01",
};

const assignment: DailyAssignment = {
  id: "assign-1",
  planId: "plan-1",
  bookId: "book-1",
  userId: "user-1",
  date: "2026-07-15",
  startPage: 1,
  endPage: 10,
  pagesToRead: 10,
  syncedAt: null,
};

describe("buildEventUid", () => {
  it("uses a stable RFC5545-style uid", () => {
    const uid = buildEventUid(
      "550e8400-e29b-41d4-a716-446655440000",
      "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "2026-07-15"
    );

    expect(uid).toContain("@reading-scheduler.app");
    expect(uid.endsWith("@reading-scheduler.app")).toBe(true);
    expect(uid).toBe(uid.toLowerCase());
  });
});

describe("assignmentToGoogleEvent", () => {
  it("uses local datetimes with timezone instead of UTC ISO strings", () => {
    const event = assignmentToGoogleEvent(
      assignment,
      book,
      "plan-1",
      "19:30",
      "America/New_York"
    );

    expect(event.start.dateTime).toBe("2026-07-15T19:30:00");
    expect(event.end.dateTime).toBe("2026-07-15T20:00:00");
    expect(event.start.timeZone).toBe("America/New_York");
    expect(event.start.dateTime).not.toContain("Z");
    expect(event.iCalUID).toContain("@reading-scheduler.app");
  });
});

describe("parseGoogleCalendarError", () => {
  it("explains when the Calendar API is disabled", () => {
    const error = parseGoogleCalendarError(
      JSON.stringify({
        error: {
          code: 403,
          message: "Google Calendar API has not been used in project 123 before or it is disabled.",
          errors: [{ reason: "accessNotConfigured" }],
          details: [
            {
              reason: "SERVICE_DISABLED",
              metadata: {
                activationUrl:
                  "https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=123",
              },
            },
          ],
        },
      })
    );

    expect(error.message).toContain("not enabled");
    expect(error.reason).toBe("SERVICE_DISABLED");
    expect(error.activationUrl).toContain("calendar-json.googleapis.com");
  });
});
