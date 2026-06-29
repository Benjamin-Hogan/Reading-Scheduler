import { promises as fs } from "fs";
import path from "path";
import type { ExportBundle } from "@/lib/db/schema";
import { emptyBundle, isEmptyBundle, mergeBundles, pruneTombstones } from "./merge";
import type { SyncSnapshot } from "./types";
import { TOMBSTONE_RETENTION_DAYS } from "./types";

const globalForSync = globalThis as typeof globalThis & {
  __syncStore?: Map<string, SyncSnapshot>;
};

function getMemoryStore(): Map<string, SyncSnapshot> {
  if (!globalForSync.__syncStore) {
    globalForSync.__syncStore = new Map();
  }
  return globalForSync.__syncStore;
}

function getSyncDir(): string {
  if (process.env.SYNC_DATA_DIR) {
    return process.env.SYNC_DATA_DIR;
  }
  if (process.env.VERCEL) {
    return path.join("/tmp", "reading-scheduler-sync");
  }
  return path.join(process.cwd(), ".sync-data");
}

function syncFilePath(userId: string): string {
  const safeUserId = userId.replace(/[^a-zA-Z0-9-_]/g, "");
  return path.join(getSyncDir(), `${safeUserId}.json`);
}

async function ensureSyncDir(): Promise<void> {
  await fs.mkdir(getSyncDir(), { recursive: true });
}

async function readSnapshotFromDisk(userId: string): Promise<SyncSnapshot | null> {
  try {
    const raw = await fs.readFile(syncFilePath(userId), "utf-8");
    const parsed = JSON.parse(raw) as SyncSnapshot;
    if (!parsed.userId || typeof parsed.revision !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeSnapshotToDisk(snapshot: SyncSnapshot): Promise<void> {
  await ensureSyncDir();
  await fs.writeFile(syncFilePath(snapshot.userId), JSON.stringify(snapshot), "utf-8");
}

async function deleteSnapshotFromDisk(userId: string): Promise<void> {
  try {
    await fs.unlink(syncFilePath(userId));
  } catch {
    // ignore missing files
  }
}

export async function getSyncSnapshot(userId: string): Promise<SyncSnapshot | null> {
  const memory = getMemoryStore().get(userId);
  if (memory) return memory;

  const fromDisk = await readSnapshotFromDisk(userId);
  if (fromDisk) {
    getMemoryStore().set(userId, fromDisk);
  }
  return fromDisk;
}

export async function saveSyncSnapshot(snapshot: SyncSnapshot): Promise<void> {
  getMemoryStore().set(snapshot.userId, snapshot);
  await writeSnapshotToDisk(snapshot);
}

export async function deleteSyncSnapshot(userId: string): Promise<boolean> {
  const existed =
    getMemoryStore().delete(userId) || (await readSnapshotFromDisk(userId)) !== null;
  await deleteSnapshotFromDisk(userId);
  return existed;
}

export async function pullSyncSnapshot(userId: string): Promise<SyncSnapshot> {
  const existing = await getSyncSnapshot(userId);
  if (existing) return existing;

  const empty: SyncSnapshot = {
    userId,
    revision: 0,
    updatedAt: new Date().toISOString(),
    bundle: emptyBundle(),
    tombstones: [],
  };
  return empty;
}

export async function pushSyncSnapshot(
  userId: string,
  incoming: {
    bundle: ExportBundle;
    tombstones: SyncSnapshot["tombstones"];
  }
): Promise<SyncSnapshot> {
  const existing = await pullSyncSnapshot(userId);
  const { bundle, tombstones } = mergeBundles(
    existing.bundle,
    incoming.bundle,
    existing.tombstones,
    incoming.tombstones
  );

  const prunedTombstones = pruneTombstones(tombstones, TOMBSTONE_RETENTION_DAYS);
  const now = new Date().toISOString();
  const snapshot: SyncSnapshot = {
    userId,
    revision: existing.revision + 1,
    updatedAt: now,
    bundle,
    tombstones: prunedTombstones,
  };

  await saveSyncSnapshot(snapshot);
  return snapshot;
}

export function snapshotIsEmpty(snapshot: SyncSnapshot): boolean {
  return snapshot.revision === 0 || isEmptyBundle(snapshot.bundle);
}
