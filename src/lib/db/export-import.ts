import { db } from "./index";
import type { ExportBundle, Tombstone } from "./schema";
import { scheduleSyncPush } from "@/lib/sync/engine";
import { clearTombstones, getPendingTombstones } from "./tombstones";

export type ImportStrategy = "merge" | "replace";

async function applyTombstoneDeletes(tombstones: Tombstone[]): Promise<void> {
  for (const tombstone of tombstones) {
    switch (tombstone.table) {
      case "books":
        await db.books.delete(tombstone.recordId);
        break;
      case "readingPlans":
        await db.readingPlans.delete(tombstone.recordId);
        break;
      case "planBooks":
        await db.planBooks.delete(tombstone.recordId);
        break;
      case "dailyAssignments":
        await db.dailyAssignments.delete(tombstone.recordId);
        break;
      case "settings":
        await db.settings.delete(tombstone.recordId);
        break;
    }
  }
}

async function putBundleRecords(
  bundle: ExportBundle,
  syncedAt?: string,
  userId?: string | null
): Promise<void> {
  const stamp = <T extends { syncedAt?: string | null; userId?: string | null }>(record: T) => ({
    ...record,
    ...(syncedAt ? { syncedAt } : {}),
    ...(userId !== undefined ? { userId } : {}),
  });

  await db.books.bulkPut(bundle.books.map(stamp));
  await db.readingPlans.bulkPut(bundle.readingPlans.map(stamp));
  await db.planBooks.bulkPut(bundle.planBooks.map(stamp));
  await db.dailyAssignments.bulkPut(bundle.dailyAssignments.map(stamp));
  if (bundle.settings) {
    await db.settings.put(stamp(bundle.settings));
  }
}

export async function exportData(): Promise<ExportBundle> {
  const [books, readingPlans, planBooks, dailyAssignments, settingsRows] =
    await Promise.all([
      db.books.toArray(),
      db.readingPlans.toArray(),
      db.planBooks.toArray(),
      db.dailyAssignments.toArray(),
      db.settings.toArray(),
    ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    books,
    readingPlans,
    planBooks,
    dailyAssignments,
    settings: settingsRows[0],
  };
}

export async function importData(
  bundle: ExportBundle,
  strategy: ImportStrategy = "merge"
): Promise<void> {
  if (bundle.version !== 1) {
    throw new Error("Unsupported export version");
  }

  await db.transaction(
    "rw",
    [db.books, db.readingPlans, db.planBooks, db.dailyAssignments, db.settings],
    async () => {
      if (strategy === "replace") {
        await Promise.all([
          db.books.clear(),
          db.readingPlans.clear(),
          db.planBooks.clear(),
          db.dailyAssignments.clear(),
          db.settings.clear(),
        ]);
      }

      await putBundleRecords(bundle);
    }
  );
  scheduleSyncPush();
}

export async function applySyncedBundle(
  bundle: ExportBundle,
  tombstones: Tombstone[],
  syncedAt: string,
  userId?: string | null
): Promise<void> {
  if (bundle.version !== 1) {
    throw new Error("Unsupported export version");
  }

  await db.transaction(
    "rw",
    [db.books, db.readingPlans, db.planBooks, db.dailyAssignments, db.settings, db.deletedRecords],
    async () => {
      await applyTombstoneDeletes(tombstones);
      await putBundleRecords(bundle, syncedAt, userId);
      const localTombstones = await getPendingTombstones();
      const remoteKeys = new Set(
        tombstones.map((t) => `${t.table}:${t.recordId}`)
      );
      const cleared = localTombstones
        .filter((t) => remoteKeys.has(`${t.table}:${t.recordId}`))
        .map((t) => t.id);
      await clearTombstones(cleared);
    }
  );
}

export async function isLocalDataEmpty(): Promise<boolean> {
  const [books, plans, assignments, planBooks] = await Promise.all([
    db.books.count(),
    db.readingPlans.count(),
    db.dailyAssignments.count(),
    db.planBooks.count(),
  ]);
  return books === 0 && plans === 0 && assignments === 0 && planBooks === 0;
}

export function downloadJson(data: ExportBundle, filename?: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `reading-scheduler-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
