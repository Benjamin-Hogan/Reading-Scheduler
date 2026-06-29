import { describe, it, expect } from "vitest";
import { computeBookWindows } from "@/lib/scheduler/layouts";
import { generateAllAssignments } from "@/lib/scheduler/generate";
import { buildFullSchedule, checkFeasibility } from "@/lib/scheduler/preview";
import { countReadingDays } from "@/lib/scheduler/dates";
import type { BookInput } from "@/lib/scheduler/types";

const activeDays = ["mon", "tue", "wed", "thu", "fri"] as const;

const bookA: BookInput = {
  bookId: "a",
  title: "Book A",
  totalPages: 200,
  currentPage: 0,
  sortOrder: 0,
};

const bookB: BookInput = {
  bookId: "b",
  title: "Book B",
  totalPages: 100,
  currentPage: 0,
  sortOrder: 1,
};

describe("computeBookWindows", () => {
  it("parallel mode gives overlapping windows", () => {
    const windows = computeBookWindows(
      [bookA, bookB],
      "2026-01-05",
      "2026-02-01",
      "parallel",
      [...activeDays]
    );
    expect(windows).toHaveLength(2);
    expect(windows[0].startDate).toBe("2026-01-05");
    expect(windows[1].startDate).toBe("2026-01-05");
    expect(windows[0].endDate).toBe("2026-02-01");
  });

  it("sequential mode queues books back-to-back", () => {
    const windows = computeBookWindows(
      [bookA, bookB],
      "2026-01-05",
      "2026-03-01",
      "sequential",
      [...activeDays]
    );
    expect(windows).toHaveLength(2);
    expect(windows[0].bookId).toBe("a");
    expect(windows[1].bookId).toBe("b");
    expect(windows[1].startDate > windows[0].endDate).toBe(true);
  });

  it("custom order respects sortOrder", () => {
    const reversed = [
      { ...bookB, sortOrder: 0 },
      { ...bookA, sortOrder: 1 },
    ];
    const windows = computeBookWindows(
      reversed,
      "2026-01-05",
      "2026-03-01",
      "custom",
      [...activeDays]
    );
    expect(windows[0].bookId).toBe("b");
    expect(windows[1].bookId).toBe("a");
  });

  it("uses only remaining pages when partially read", () => {
    const windows = computeBookWindows(
      [{ ...bookA, currentPage: 50 }],
      "2026-01-05",
      "2026-02-01",
      "parallel",
      [...activeDays]
    );
    expect(windows[0].pagesRemaining).toBe(150);
  });
});

describe("generateAllAssignments", () => {
  it("remainder pages land on final reading day", () => {
    const windows = computeBookWindows(
      [{ ...bookA, totalPages: 100 }],
      "2026-01-05",
      "2026-01-16",
      "parallel",
      [...activeDays]
    );
    const assignments = generateAllAssignments("plan-1", windows, [...activeDays]);
    const totalPages = assignments.reduce((s, a) => s + a.pagesToRead, 0);
    expect(totalPages).toBe(100);
  });

  it("parallel books overlap on same dates", () => {
    const windows = computeBookWindows(
      [bookA, bookB],
      "2026-01-05",
      "2026-01-30",
      "parallel",
      [...activeDays]
    );
    const assignments = generateAllAssignments("plan-1", windows, [...activeDays]);
    const datesA = new Set(assignments.filter((a) => a.bookId === "a").map((a) => a.date));
    const datesB = new Set(assignments.filter((a) => a.bookId === "b").map((a) => a.date));
    const overlap = [...datesA].filter((d) => datesB.has(d));
    expect(overlap.length).toBeGreaterThan(0);
  });
});

describe("checkFeasibility", () => {
  it("sequential plan finishes by the deadline", () => {
    const windows = computeBookWindows(
      [bookA, bookB],
      "2026-01-05",
      "2026-01-10",
      "sequential",
      [...activeDays]
    );
    const result = checkFeasibility(windows, "2026-01-10", "sequential");
    expect(result.feasible).toBe(true);
    expect(result.projectedEndDate <= "2026-01-10").toBe(true);
  });
});

describe("multi-book schedule within timeframe", () => {
  const largeBooks = [
    { bookId: "a", title: "Book A", totalPages: 300, currentPage: 0, sortOrder: 0 },
    { bookId: "b", title: "Book B", totalPages: 250, currentPage: 0, sortOrder: 1 },
  ];
  const start = "2026-06-29";
  const end = "2026-07-29";

  it("parallel mode fits within the chosen deadline", () => {
    const readingDays = countReadingDays(start, end, [...activeDays]);
    const schedule = buildFullSchedule({
      planId: "test",
      name: "Test",
      startDate: start,
      targetEndDate: end,
      layoutMode: "parallel",
      activeDays: [...activeDays],
      preferredReadTime: "08:00",
      books: largeBooks,
    });

    expect(readingDays).toBe(23);
    expect(schedule.projectedEndDate).toBe(end);
    expect(schedule.feasibility.feasible).toBe(true);
    expect(schedule.totalPagesPerDay).toBeGreaterThan(10);
  });

  it("sequential mode splits the window across books instead of overshooting", () => {
    const schedule = buildFullSchedule({
      planId: "test",
      name: "Test",
      startDate: start,
      targetEndDate: end,
      layoutMode: "sequential",
      activeDays: [...activeDays],
      preferredReadTime: "08:00",
      books: largeBooks,
    });

    expect(schedule.projectedEndDate).toBe(end);
    expect(schedule.feasibility.feasible).toBe(true);
    expect(schedule.windows[0].pagesPerDay).toBeGreaterThan(10);
    expect(schedule.windows[1].pagesPerDay).toBeGreaterThan(10);

    const totalAssigned = schedule.assignments.reduce((s, a) => s + a.pagesToRead, 0);
    expect(totalAssigned).toBe(550);
  });

  it("sequential mode with modest books uses the full month", () => {
    const smallBooks = [
      { bookId: "a", title: "Book A", totalPages: 92, currentPage: 0, sortOrder: 0 },
      { bookId: "b", title: "Book B", totalPages: 92, currentPage: 0, sortOrder: 1 },
    ];
    const schedule = buildFullSchedule({
      planId: "test",
      name: "Test",
      startDate: start,
      targetEndDate: end,
      layoutMode: "sequential",
      activeDays: [...activeDays],
      preferredReadTime: "08:00",
      books: smallBooks,
    });

    expect(schedule.projectedEndDate).toBe(end);
    expect(schedule.feasibility.feasible).toBe(true);
    expect(schedule.totalPagesPerDay).toBeGreaterThanOrEqual(4);
    expect(schedule.totalPagesPerDay).toBeLessThanOrEqual(10);
  });
});
