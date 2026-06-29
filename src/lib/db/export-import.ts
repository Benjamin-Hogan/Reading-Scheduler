import { db } from "./index";
import type { ExportBundle } from "./schema";

export type ImportStrategy = "merge" | "replace";

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

      await db.books.bulkPut(bundle.books);
      await db.readingPlans.bulkPut(bundle.readingPlans);
      await db.planBooks.bulkPut(bundle.planBooks);
      await db.dailyAssignments.bulkPut(bundle.dailyAssignments);
      if (bundle.settings) {
        await db.settings.put(bundle.settings);
      }
    }
  );
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
