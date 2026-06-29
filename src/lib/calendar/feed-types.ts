import type { Book, DailyAssignment } from "@/lib/db/schema";

/** Minimal book fields stored server-side for ICS generation. */
export type FeedBook = Pick<Book, "id" | "title">;

export interface CalendarFeedPayload {
  version: 1;
  updatedAt: string;
  /** Incremented on each publish so calendar clients refresh events. */
  sequence: number;
  planId: string;
  planName: string;
  preferredReadTime: string;
  timezone: string;
  assignments: DailyAssignment[];
  books: FeedBook[];
}

export interface PublishFeedRequest {
  planId: string;
  planName: string;
  preferredReadTime: string;
  timezone: string;
  assignments: DailyAssignment[];
  books: Book[];
  token?: string | null;
}

export interface PublishFeedResponse {
  token: string;
  feedUrl: string;
  webcalUrl: string;
  updatedAt: string;
}
