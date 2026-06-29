import type { Book, DailyAssignment, LayoutMode, PlanBook, ReadingPlan, WeekdayKey } from "@/lib/db/schema";

export interface BookInput {
  bookId: string;
  title: string;
  totalPages: number;
  currentPage: number;
  sortOrder: number;
}

export interface ScheduleInput {
  planId: string;
  name: string;
  startDate: string;
  targetEndDate: string;
  layoutMode: LayoutMode;
  activeDays: WeekdayKey[];
  preferredReadTime: string;
  pagesPerDayOverride?: number | null;
  books: BookInput[];
}

export interface BookWindow {
  bookId: string;
  title: string;
  sortOrder: number;
  startDate: string;
  endDate: string;
  totalPages: number;
  currentPage: number;
  pagesRemaining: number;
  readingDays: number;
  pagesPerDay: number;
}

export interface TimelineSegment {
  bookId: string;
  title: string;
  startDate: string;
  endDate: string;
  pagesPerDay: number;
  sortOrder: number;
}

export interface SchedulePreview {
  windows: BookWindow[];
  segments: TimelineSegment[];
  assignments: DailyAssignment[];
  totalPagesPerDay: number;
  projectedEndDate: string;
}

export interface FeasibilityResult {
  feasible: boolean;
  message?: string;
  projectedEndDate: string;
  targetEndDate: string;
  daysOver?: number;
}
