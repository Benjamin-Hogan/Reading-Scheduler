import { promises as fs } from "fs";
import path from "path";
import type { CalendarFeedPayload } from "./feed-types";

const globalForFeeds = globalThis as typeof globalThis & {
  __calendarFeedStore?: Map<string, CalendarFeedPayload>;
};

function getMemoryStore(): Map<string, CalendarFeedPayload> {
  if (!globalForFeeds.__calendarFeedStore) {
    globalForFeeds.__calendarFeedStore = new Map();
  }
  return globalForFeeds.__calendarFeedStore;
}

function getFeedDir(): string {
  if (process.env.FEED_DATA_DIR) {
    return process.env.FEED_DATA_DIR;
  }
  if (process.env.VERCEL) {
    return path.join("/tmp", "reading-scheduler-feeds");
  }
  return path.join(process.cwd(), ".feed-data");
}

function feedFilePath(token: string): string {
  const safeToken = token.replace(/[^a-zA-Z0-9-]/g, "");
  return path.join(getFeedDir(), `${safeToken}.json`);
}

async function ensureFeedDir(): Promise<void> {
  await fs.mkdir(getFeedDir(), { recursive: true });
}

async function readFeedFromDisk(token: string): Promise<CalendarFeedPayload | null> {
  try {
    const raw = await fs.readFile(feedFilePath(token), "utf-8");
    const parsed = JSON.parse(raw) as CalendarFeedPayload;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeFeedToDisk(token: string, payload: CalendarFeedPayload): Promise<void> {
  await ensureFeedDir();
  await fs.writeFile(feedFilePath(token), JSON.stringify(payload), "utf-8");
}

async function deleteFeedFromDisk(token: string): Promise<void> {
  try {
    await fs.unlink(feedFilePath(token));
  } catch {
    // ignore missing files
  }
}

export async function getCalendarFeed(token: string): Promise<CalendarFeedPayload | null> {
  const memory = getMemoryStore().get(token);
  if (memory) return memory;

  const fromDisk = await readFeedFromDisk(token);
  if (fromDisk) {
    getMemoryStore().set(token, fromDisk);
  }
  return fromDisk;
}

export async function saveCalendarFeed(
  token: string,
  payload: CalendarFeedPayload
): Promise<void> {
  getMemoryStore().set(token, payload);
  await writeFeedToDisk(token, payload);
}

export async function deleteCalendarFeed(token: string): Promise<boolean> {
  const existed = getMemoryStore().delete(token) || (await readFeedFromDisk(token)) !== null;
  await deleteFeedFromDisk(token);
  return existed;
}

export function createFeedToken(): string {
  return crypto.randomUUID();
}
