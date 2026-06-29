import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import type { CalendarFeedPayload } from "@/lib/calendar/feed-types";
import {
  buildFeedUrl,
  buildWebcalUrl,
  generateFeedIcs,
  normalizeFeedToken,
} from "@/lib/calendar/feed";

const samplePayload: CalendarFeedPayload = {
  version: 1,
  updatedAt: "2026-06-29T12:00:00.000Z",
  sequence: 2,
  planId: "plan-1",
  planName: "Summer Reading",
  preferredReadTime: "19:00",
  timezone: "America/New_York",
  assignments: [
    {
      id: "assign-1",
      planId: "plan-1",
      bookId: "book-1",
      date: "2026-07-15",
      startPage: 1,
      endPage: 10,
      pagesToRead: 10,
    },
  ],
  books: [{ id: "book-1", title: "Test Book" }],
};

describe("normalizeFeedToken", () => {
  it("strips a trailing .ics suffix", () => {
    expect(normalizeFeedToken("abc-123.ics")).toBe("abc-123");
    expect(normalizeFeedToken("abc-123.ICS")).toBe("abc-123");
  });
});

describe("buildFeedUrl", () => {
  it("builds a stable API path", () => {
    expect(buildFeedUrl("https://read.example.com", "token-1")).toBe(
      "https://read.example.com/api/calendar/feed/token-1"
    );
  });
});

describe("buildWebcalUrl", () => {
  it("rewrites https to webcal", () => {
    expect(
      buildWebcalUrl("https://read.example.com/api/calendar/feed/token-1")
    ).toBe("webcal://read.example.com/api/calendar/feed/token-1");
  });
});

describe("generateFeedIcs", () => {
  it("includes calendar metadata and stable event uids", async () => {
    const ics = await generateFeedIcs(samplePayload);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("X-WR-CALNAME:Summer Reading");
    expect(ics).toContain("X-PUBLISHED-TTL:PT1H");
    expect(ics).toContain("SEQUENCE:2");
    expect(ics).toContain("plan-1-book-1-2026-07-15@reading-scheduler.app");
    expect(ics).toContain("Read 10 pp — Test Book");
  });
});

describe("calendar feed store", () => {
  let feedDir = "";

  beforeEach(async () => {
    feedDir = await mkdtemp(path.join(tmpdir(), "reading-feed-"));
    process.env.FEED_DATA_DIR = feedDir;
    const { __calendarFeedStore } = globalThis as typeof globalThis & {
      __calendarFeedStore?: Map<string, CalendarFeedPayload>;
    };
    __calendarFeedStore?.clear();
  });

  afterEach(async () => {
    delete process.env.FEED_DATA_DIR;
    const { __calendarFeedStore } = globalThis as typeof globalThis & {
      __calendarFeedStore?: Map<string, CalendarFeedPayload>;
    };
    __calendarFeedStore?.clear();
    await rm(feedDir, { recursive: true, force: true });
  });

  it("persists and reloads feed payloads", async () => {
    const {
      saveCalendarFeed,
      getCalendarFeed,
      deleteCalendarFeed,
      createFeedToken,
    } = await import("@/lib/calendar/feed-store");

    const token = createFeedToken();
    await saveCalendarFeed(token, samplePayload);

    const { __calendarFeedStore } = globalThis as typeof globalThis & {
      __calendarFeedStore?: Map<string, CalendarFeedPayload>;
    };
    __calendarFeedStore?.clear();

    const loaded = await getCalendarFeed(token);
    expect(loaded).toEqual(samplePayload);

    const deleted = await deleteCalendarFeed(token);
    expect(deleted).toBe(true);
    expect(await getCalendarFeed(token)).toBeNull();
  });
});
