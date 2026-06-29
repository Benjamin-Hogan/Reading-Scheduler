import { db } from "./index";
import type { SyncTableName } from "./schema";

export function tombstoneId(table: SyncTableName, recordId: string): string {
  return `${table}:${recordId}`;
}

export async function recordDeletion(
  table: SyncTableName,
  recordId: string
): Promise<void> {
  const deletedAt = new Date().toISOString();
  await db.deletedRecords.put({
    id: tombstoneId(table, recordId),
    recordId,
    table,
    deletedAt,
  });
}

export async function getPendingTombstones() {
  return db.deletedRecords.toArray();
}

export async function clearTombstones(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db.deletedRecords.bulkDelete(ids);
}

export async function pruneOldTombstones(maxAgeDays = 30): Promise<void> {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const stale = await db.deletedRecords
    .filter((t) => new Date(t.deletedAt).getTime() < cutoff)
    .toArray();
  await clearTombstones(stale.map((t) => t.id));
}
