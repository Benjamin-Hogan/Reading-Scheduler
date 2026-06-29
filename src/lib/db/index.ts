import Dexie, { type Table } from "dexie";
import type {
  AppSettings,
  Book,
  DailyAssignment,
  DeletedRecord,
  PlanBook,
  ReadingPlan,
} from "./schema";

function backfillUpdatedAt<T extends { updatedAt?: string; createdAt?: string; syncedAt?: string | null }>(
  record: T,
  fallback: string
): void {
  if (!record.updatedAt) {
    record.updatedAt = record.syncedAt ?? record.createdAt ?? fallback;
  }
}

export class ReadingSchedulerDB extends Dexie {
  books!: Table<Book, string>;
  readingPlans!: Table<ReadingPlan, string>;
  planBooks!: Table<PlanBook, string>;
  dailyAssignments!: Table<DailyAssignment, string>;
  settings!: Table<AppSettings, string>;
  deletedRecords!: Table<DeletedRecord, string>;

  constructor() {
    super("ReadingSchedulerDB");
    this.version(1).stores({
      books: "id, title, createdAt",
      readingPlans: "id, status, createdAt, startDate, targetEndDate",
      planBooks: "id, planId, bookId, sortOrder",
      dailyAssignments: "id, planId, bookId, date",
      settings: "id",
    });
    this.version(2)
      .stores({
        books: "id, title, createdAt, updatedAt",
        readingPlans: "id, status, createdAt, startDate, targetEndDate, updatedAt",
        planBooks: "id, planId, bookId, sortOrder, updatedAt",
        dailyAssignments: "id, planId, bookId, date, updatedAt",
        settings: "id, updatedAt",
        deletedRecords: "id, table, deletedAt, recordId",
      })
      .upgrade(async (tx) => {
        const now = new Date().toISOString();
        await tx
          .table("books")
          .toCollection()
          .modify((book: Book) => backfillUpdatedAt(book, now));
        await tx
          .table("readingPlans")
          .toCollection()
          .modify((plan: ReadingPlan) => backfillUpdatedAt(plan, now));
        await tx
          .table("planBooks")
          .toCollection()
          .modify((pb: PlanBook) => backfillUpdatedAt(pb, now));
        await tx
          .table("dailyAssignments")
          .toCollection()
          .modify((a: DailyAssignment) => backfillUpdatedAt(a, now));
        await tx
          .table("settings")
          .toCollection()
          .modify((s: AppSettings) => backfillUpdatedAt(s, now));
      });
  }
}

export const db = new ReadingSchedulerDB();
