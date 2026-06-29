import Dexie, { type Table } from "dexie";
import type {
  AppSettings,
  Book,
  DailyAssignment,
  PlanBook,
  ReadingPlan,
} from "./schema";

export class ReadingSchedulerDB extends Dexie {
  books!: Table<Book, string>;
  readingPlans!: Table<ReadingPlan, string>;
  planBooks!: Table<PlanBook, string>;
  dailyAssignments!: Table<DailyAssignment, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super("ReadingSchedulerDB");
    this.version(1).stores({
      books: "id, title, createdAt",
      readingPlans: "id, status, createdAt, startDate, targetEndDate",
      planBooks: "id, planId, bookId, sortOrder",
      dailyAssignments: "id, planId, bookId, date",
      settings: "id",
    });
  }
}

export const db = new ReadingSchedulerDB();
