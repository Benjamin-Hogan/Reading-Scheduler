import { describe, it, expect } from "vitest";
import {
  buildScheduleFromDate,
  getRegenerationStartDate,
} from "@/lib/scheduler/regenerate";
import type { BookInput } from "@/lib/scheduler/types";

const books: BookInput[] = [
  {
    bookId: "b1",
    title: "Book One",
    totalPages: 300,
    currentPage: 50,
    sortOrder: 0,
  },
];

describe("getRegenerationStartDate", () => {
  it("uses plan start when today is before plan", () => {
    const start = getRegenerationStartDate("2026-08-01", ["mon", "wed", "fri"], "2026-07-01");
    expect(start).toBe("2026-08-01");
  });

  it("uses today when today is an active reading day", () => {
    const start = getRegenerationStartDate(
      "2026-01-01",
      ["mon", "tue", "wed", "thu", "fri"],
      "2026-06-29"
    );
    expect(start).toBe("2026-06-29");
  });
});

describe("buildScheduleFromDate", () => {
  it("schedules remaining pages from a mid-plan date", () => {
    const schedule = buildScheduleFromDate(
      {
        planId: "plan-1",
        name: "Test",
        startDate: "2026-06-01",
        targetEndDate: "2026-07-31",
        layoutMode: "parallel",
        activeDays: ["mon", "tue", "wed", "thu", "fri"],
        preferredReadTime: "19:00",
        books,
      },
      "2026-06-15"
    );

    expect(schedule.assignments.length).toBeGreaterThan(0);
    expect(schedule.assignments[0].startPage).toBeGreaterThanOrEqual(50);
    expect(schedule.assignments.every((a) => a.date >= "2026-06-15")).toBe(true);
  });
});
