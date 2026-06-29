import type {
  AppSettings,
  Book,
  DailyAssignment,
  ExportBundle,
  PlanBook,
  ReadingPlan,
  Tombstone,
} from "@/lib/db/schema";

function recordTimestamp(record: { updatedAt?: string; createdAt?: string; syncedAt?: string | null }): number {
  const raw = record.updatedAt ?? record.syncedAt ?? record.createdAt;
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? 0 : t;
}

function pickNewer<T extends { id: string; updatedAt?: string; createdAt?: string; syncedAt?: string | null }>(
  a: T,
  b: T
): T {
  const aTime = recordTimestamp(a);
  const bTime = recordTimestamp(b);
  if (bTime > aTime) return b;
  if (aTime > bTime) return a;
  return b;
}

function mergeRecordLists<T extends { id: string; updatedAt?: string; createdAt?: string; syncedAt?: string | null }>(
  left: T[],
  right: T[]
): T[] {
  const map = new Map<string, T>();
  for (const record of left) {
    map.set(record.id, record);
  }
  for (const record of right) {
    const existing = map.get(record.id);
    map.set(record.id, existing ? pickNewer(existing, record) : record);
  }
  return Array.from(map.values());
}

function mergeSettings(
  left?: AppSettings,
  right?: AppSettings
): AppSettings | undefined {
  if (!left && !right) return undefined;
  if (!left) return right;
  if (!right) return left;
  return pickNewer(left, right);
}

function tombstoneTimestamp(tombstone: Tombstone): number {
  const t = Date.parse(tombstone.deletedAt);
  return Number.isNaN(t) ? 0 : t;
}

function mergeTombstones(left: Tombstone[], right: Tombstone[]): Tombstone[] {
  const map = new Map<string, Tombstone>();
  for (const tombstone of [...left, ...right]) {
    const key = `${tombstone.table}:${tombstone.recordId}`;
    const existing = map.get(key);
    if (!existing || tombstoneTimestamp(tombstone) >= tombstoneTimestamp(existing)) {
      map.set(key, tombstone);
    }
  }
  return Array.from(map.values());
}

function applyTombstonesToBundle(
  bundle: ExportBundle,
  tombstones: Tombstone[]
): ExportBundle {
  const deletedBooks = new Set<string>();
  const deletedPlans = new Set<string>();
  const deletedPlanBooks = new Set<string>();
  const deletedAssignments = new Set<string>();
  let dropSettings = false;

  for (const tombstone of tombstones) {
    switch (tombstone.table) {
      case "books":
        deletedBooks.add(tombstone.recordId);
        break;
      case "readingPlans":
        deletedPlans.add(tombstone.recordId);
        break;
      case "planBooks":
        deletedPlanBooks.add(tombstone.recordId);
        break;
      case "dailyAssignments":
        deletedAssignments.add(tombstone.recordId);
        break;
      case "settings":
        dropSettings = true;
        break;
    }
  }

  return {
    ...bundle,
    books: bundle.books.filter((b) => !deletedBooks.has(b.id)),
    readingPlans: bundle.readingPlans.filter((p) => !deletedPlans.has(p.id)),
    planBooks: bundle.planBooks.filter((pb) => !deletedPlanBooks.has(pb.id)),
    dailyAssignments: bundle.dailyAssignments.filter((a) => !deletedAssignments.has(a.id)),
    settings: dropSettings ? undefined : bundle.settings,
  };
}

export function mergeBundles(
  local: ExportBundle,
  remote: ExportBundle,
  localTombstones: Tombstone[] = [],
  remoteTombstones: Tombstone[] = []
): { bundle: ExportBundle; tombstones: Tombstone[] } {
  const tombstones = mergeTombstones(localTombstones, remoteTombstones);
  const merged: ExportBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    books: mergeRecordLists<Book>(local.books, remote.books),
    readingPlans: mergeRecordLists<ReadingPlan>(local.readingPlans, remote.readingPlans),
    planBooks: mergeRecordLists<PlanBook>(local.planBooks, remote.planBooks),
    dailyAssignments: mergeRecordLists<DailyAssignment>(
      local.dailyAssignments,
      remote.dailyAssignments
    ),
    settings: mergeSettings(local.settings, remote.settings),
  };

  return {
    bundle: applyTombstonesToBundle(merged, tombstones),
    tombstones,
  };
}

export function emptyBundle(): ExportBundle {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    books: [],
    readingPlans: [],
    planBooks: [],
    dailyAssignments: [],
  };
}

export function isEmptyBundle(bundle: ExportBundle): boolean {
  return (
    bundle.books.length === 0 &&
    bundle.readingPlans.length === 0 &&
    bundle.planBooks.length === 0 &&
    bundle.dailyAssignments.length === 0 &&
    !bundle.settings
  );
}

export function pruneTombstones(
  tombstones: Tombstone[],
  maxAgeDays: number
): Tombstone[] {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  return tombstones.filter((t) => Date.parse(t.deletedAt) >= cutoff);
}
