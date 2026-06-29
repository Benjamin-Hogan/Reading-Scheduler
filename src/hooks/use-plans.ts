"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type {
  Book,
  DailyAssignment,
  PlanBook,
  ReadingPlan,
  WeekdayKey,
} from "@/lib/db/schema";
import {
  buildScheduleFromDate,
  getRegenerationStartDate,
} from "@/lib/scheduler";
import { generateId } from "@/lib/utils";
import { syncPlanCalendarFeed, revokeCalendarFeed } from "@/lib/calendar/feed-client";

export interface PlanWithDetails {
  plan: ReadingPlan;
  planBooks: PlanBook[];
  books: Book[];
  assignments: DailyAssignment[];
}

export function usePlans() {
  const plans = useLiveQuery(
    () => db.readingPlans.orderBy("createdAt").reverse().toArray(),
    []
  );

  const getPlanDetails = async (planId: string): Promise<PlanWithDetails | null> => {
    const plan = await db.readingPlans.get(planId);
    if (!plan) return null;

    const planBooks = await db.planBooks
      .where("planId")
      .equals(planId)
      .sortBy("sortOrder");
    const bookIds = planBooks.map((pb) => pb.bookId);
    const books = bookIds.length ? await db.books.bulkGet(bookIds) : [];
    const assignments = await db.dailyAssignments
      .where("planId")
      .equals(planId)
      .sortBy("date");

    return {
      plan,
      planBooks,
      books: books.filter((b): b is Book => b !== undefined),
      assignments,
    };
  };

  const savePlan = async (data: {
    plan: Omit<ReadingPlan, "id" | "createdAt">;
    planBooks: Omit<PlanBook, "id" | "planId">[];
    assignments: Omit<DailyAssignment, "id" | "planId">[];
  }) => {
    const planId = generateId();
    const plan: ReadingPlan = {
      ...data.plan,
      id: planId,
      createdAt: new Date().toISOString(),
    };

    const planBooks: PlanBook[] = data.planBooks.map((pb) => ({
      ...pb,
      id: generateId(),
      planId,
    }));

    const assignments: DailyAssignment[] = data.assignments.map((a) => ({
      ...a,
      id: generateId(),
      planId,
    }));

    await db.transaction("rw", [db.readingPlans, db.planBooks, db.dailyAssignments], async () => {
      await db.readingPlans.add(plan);
      await db.planBooks.bulkAdd(planBooks);
      await db.dailyAssignments.bulkAdd(assignments);
    });

    return planId;
  };

  const updatePlan = async (
    planId: string,
    updates: Partial<
      Pick<
        ReadingPlan,
        | "name"
        | "startDate"
        | "targetEndDate"
        | "layoutMode"
        | "activeDays"
        | "preferredReadTime"
        | "pagesPerDayOverride"
        | "status"
        | "calendarFeedToken"
      >
    >
  ) => {
    await db.readingPlans.update(planId, updates);
  };

  const regeneratePlanSchedule = async (planId: string) => {
    const details = await getPlanDetails(planId);
    if (!details) throw new Error("Plan not found");

    const { plan, planBooks, books } = details;
    const activeDays = plan.activeDays as WeekdayKey[];
    const fromDate = getRegenerationStartDate(plan.startDate, activeDays);

    const schedule = buildScheduleFromDate(
      {
        planId: plan.id,
        name: plan.name,
        startDate: plan.startDate,
        targetEndDate: plan.targetEndDate,
        layoutMode: plan.layoutMode,
        activeDays,
        preferredReadTime: plan.preferredReadTime,
        pagesPerDayOverride: plan.pagesPerDayOverride,
        books: books.map((b) => {
          const pb = planBooks.find((p) => p.bookId === b.id);
          return {
            bookId: b.id,
            title: b.title,
            totalPages: b.totalPages,
            currentPage: b.currentPage,
            sortOrder: pb?.sortOrder ?? 0,
          };
        }),
      },
      fromDate
    );

    const newPlanBooks: PlanBook[] = schedule.windows.map((w, i) => ({
      id: generateId(),
      planId,
      bookId: w.bookId,
      sortOrder: i,
      bookStartDate: w.startDate,
      bookEndDate: w.endDate,
    }));

    const newAssignments: DailyAssignment[] = schedule.assignments.map((a) => ({
      id: generateId(),
      planId,
      bookId: a.bookId,
      date: a.date,
      startPage: a.startPage,
      endPage: a.endPage,
      pagesToRead: a.pagesToRead,
    }));

    await db.transaction("rw", [db.planBooks, db.dailyAssignments], async () => {
      await db.planBooks.where("planId").equals(planId).delete();
      await db.dailyAssignments.where("planId").equals(planId).delete();
      await db.planBooks.bulkAdd(newPlanBooks);
      await db.dailyAssignments.bulkAdd(newAssignments);
    });

    if (plan.calendarFeedToken) {
      await syncPlanCalendarFeed(planId);
    }

    return schedule;
  };

  const deletePlan = async (planId: string) => {
    const plan = await db.readingPlans.get(planId);
    if (plan?.calendarFeedToken) {
      try {
        await revokeCalendarFeed(plan.calendarFeedToken);
      } catch {
        // Plan deletion should proceed even if feed revoke fails.
      }
    }

    await db.transaction("rw", [db.readingPlans, db.planBooks, db.dailyAssignments], async () => {
      await db.dailyAssignments.where("planId").equals(planId).delete();
      await db.planBooks.where("planId").equals(planId).delete();
      await db.readingPlans.delete(planId);
    });
  };

  const updatePlanStatus = async (planId: string, status: ReadingPlan["status"]) => {
    await db.readingPlans.update(planId, { status });
  };

  return {
    plans: plans ?? [],
    isLoading: plans === undefined,
    getPlanDetails,
    savePlan,
    updatePlan,
    regeneratePlanSchedule,
    deletePlan,
    updatePlanStatus,
  };
}

export function usePlanDetails(planId: string) {
  return useLiveQuery(async () => {
    const plan = await db.readingPlans.get(planId);
    if (!plan) return null;

    const planBooks = await db.planBooks
      .where("planId")
      .equals(planId)
      .sortBy("sortOrder");
    const bookIds = planBooks.map((pb) => pb.bookId);
    const books = bookIds.length ? await db.books.bulkGet(bookIds) : [];
    const assignments = await db.dailyAssignments
      .where("planId")
      .equals(planId)
      .sortBy("date");

    return {
      plan,
      planBooks,
      books: books.filter((b): b is Book => b !== undefined),
      assignments,
    } satisfies PlanWithDetails;
  }, [planId]);
}
