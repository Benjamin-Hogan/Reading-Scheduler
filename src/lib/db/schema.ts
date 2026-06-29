export type BookSource = "google" | "manual";
export type BookStatus = "want-to-read" | "reading" | "finished";
export type BookFormat = "physical" | "ebook" | "audiobook";
export type LayoutMode = "parallel" | "sequential" | "custom";
export type PlanStatus = "active" | "completed" | "archived";

export interface SyncFields {
  userId?: string | null;
  syncedAt?: string | null;
}

export interface Book extends SyncFields {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  totalPages: number;
  currentPage: number;
  status?: BookStatus;
  coverUrl?: string;
  source: BookSource;
  googleVolumeId?: string;
  isbn?: string;
  description?: string;
  publishedDate?: string;
  publisher?: string;
  language?: string;
  categories?: string[];
  format?: BookFormat;
  notes?: string;
  tags?: string[];
  personalRating?: number;
  startedAt?: string;
  finishedAt?: string;
  previewLink?: string;
  createdAt: string;
}

export interface PlanTemplate {
  id: string;
  name: string;
  layoutMode: LayoutMode;
  activeDays: string[];
  preferredReadTime: string;
  pagesPerDayOverride?: number | null;
}

export interface ReadingPlan extends SyncFields {
  id: string;
  name: string;
  startDate: string;
  targetEndDate: string;
  layoutMode: LayoutMode;
  activeDays: string[];
  preferredReadTime: string;
  pagesPerDayOverride?: number | null;
  status: PlanStatus;
  createdAt: string;
}

export interface PlanBook extends SyncFields {
  id: string;
  planId: string;
  bookId: string;
  sortOrder: number;
  bookStartDate: string;
  bookEndDate: string;
}

export interface DailyAssignment extends SyncFields {
  id: string;
  planId: string;
  bookId: string;
  date: string;
  startPage: number;
  endPage: number;
  pagesToRead: number;
}

export interface AppSettings {
  id: string;
  defaultActiveDays: string[];
  preferredReadTime: string;
  timezone: string;
  googleRefreshToken?: string | null;
  soundEffectsEnabled?: boolean;
  soundVolume?: number;
  planTemplates?: PlanTemplate[];
}

export interface ExportBundle {
  version: 1;
  exportedAt: string;
  books: Book[];
  readingPlans: ReadingPlan[];
  planBooks: PlanBook[];
  dailyAssignments: DailyAssignment[];
  settings?: AppSettings;
}

export const WEEKDAYS = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

export type WeekdayKey = (typeof WEEKDAYS)[number]["key"];

export const DEFAULT_ACTIVE_DAYS: WeekdayKey[] = ["mon", "tue", "wed", "thu", "fri"];
