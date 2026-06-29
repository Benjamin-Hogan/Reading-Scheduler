import type { FeasibilityResult, ScheduleInput, SchedulePreview, TimelineSegment } from "./types";
import { computeBookWindows } from "./layouts";
import { generateAllAssignments } from "./generate";
import { compareDates } from "./dates";

export function checkFeasibility(
  windows: { endDate: string }[],
  targetEndDate: string,
  layoutMode: string
): FeasibilityResult {
  if (windows.length === 0) {
    return { feasible: true, projectedEndDate: targetEndDate, targetEndDate };
  }

  const projectedEndDate = windows.reduce(
    (max, w) => (compareDates(w.endDate, max) > 0 ? w.endDate : max),
    windows[0].endDate
  );

  const feasible = compareDates(projectedEndDate, targetEndDate) <= 0;

  if (feasible) {
    return { feasible: true, projectedEndDate, targetEndDate };
  }

  const proj = new Date(projectedEndDate);
  const target = new Date(targetEndDate);
  const daysOver = Math.ceil((proj.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  return {
    feasible: false,
    projectedEndDate,
    targetEndDate,
    daysOver,
    message:
      layoutMode === "parallel"
        ? `At this pace, you'll need ${daysOver} more day(s) than your deadline. Try fewer books, a later finish date, or more reading days per week.`
        : `This reading queue finishes ${daysOver} day(s) after your deadline. Extend the date, remove a book, or switch to parallel reading.`,
  };
}

export function buildSchedulePreview(input: ScheduleInput): SchedulePreview {
  const windows = computeBookWindows(
    input.books,
    input.startDate,
    input.targetEndDate,
    input.layoutMode,
    input.activeDays,
    input.pagesPerDayOverride
  );

  const segments: TimelineSegment[] = windows.map((w) => ({
    bookId: w.bookId,
    title: w.title,
    startDate: w.startDate,
    endDate: w.endDate,
    pagesPerDay: w.pagesPerDay,
    sortOrder: w.sortOrder,
  }));

  const rawAssignments = generateAllAssignments(
    input.planId || "preview",
    windows,
    input.activeDays
  );

  const assignments = rawAssignments.map((a) => ({
    ...a,
    id: `preview-${a.bookId}-${a.date}`,
  }));

  const projectedEndDate = windows.reduce(
    (max, w) => (compareDates(w.endDate, max) > 0 ? w.endDate : max),
    input.targetEndDate
  );

  const pagesByDate = new Map<string, number>();
  for (const a of rawAssignments) {
    pagesByDate.set(a.date, (pagesByDate.get(a.date) ?? 0) + a.pagesToRead);
  }
  const totalPagesPerDay =
    pagesByDate.size > 0
      ? Math.round(
          [...pagesByDate.values()].reduce((s, v) => s + v, 0) / pagesByDate.size
        )
      : 0;

  return {
    windows,
    segments,
    assignments,
    totalPagesPerDay,
    projectedEndDate,
  };
}

export function buildFullSchedule(input: ScheduleInput) {
  const preview = buildSchedulePreview(input);
  const feasibility = checkFeasibility(
    preview.windows,
    input.targetEndDate,
    input.layoutMode
  );
  return { ...preview, feasibility };
}
