"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Archive, Calendar, RefreshCw, Settings2, Trash2, Trophy } from "lucide-react";
import { usePlanDetails, usePlans } from "@/hooks/use-plans";
import { useBooks } from "@/hooks/use-books";
import { useSettings } from "@/hooks/use-settings";
import { buildFullSchedule } from "@/lib/scheduler";
import { deletePlanCalendarEvents } from "@/lib/calendar/client";
import { TimelinePreview } from "@/components/plans/TimelinePreview";
import { AdjustPlanDialog } from "@/components/plans/AdjustPlanDialog";
import { AnimatedProgressBar } from "@/components/progress/ProgressBar";
import { PageUpdateForm } from "@/components/progress/PageUpdateForm";
import { PaceIndicator } from "@/components/progress/PaceIndicator";
import { ExportDialog } from "@/components/calendar/ExportDialog";
import { TodaysReading } from "@/components/reading/TodaysReading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FadeIn, StaggerList, StaggerItem, BounceIn, PopIn } from "@/components/layout/motion";
import { formatDisplayDate } from "@/lib/scheduler/dates";
import { playSound } from "@/lib/sounds";
import { fireConfetti } from "@/lib/celebrate";
import type { WeekdayKey } from "@/lib/db/schema";

export default function PlanDetailClient({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const details = usePlanDetails(id);
  const { deletePlan, updatePlanStatus, updatePlan, regeneratePlanSchedule } = usePlans();
  const { updateBook } = useBooks();
  const { settings } = useSettings();
  const [exportOpen, setExportOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [celebrated, setCelebrated] = useState(false);
  const [dismissedReexport, setDismissedReexport] = useState(false);

  const planMissing = details === null;

  useEffect(() => {
    if (searchParams.get("export") === "1") {
      setExportOpen(true);
    }
  }, [searchParams]);

  const allComplete =
    details?.books.every((b) => b.currentPage >= b.totalPages) ?? false;
  const planStatus = details?.plan.status;

  useEffect(() => {
    if (details && allComplete && planStatus === "active") {
      updatePlanStatus(details.plan.id, "completed");
    }
  }, [details, allComplete, planStatus, updatePlanStatus]);

  useEffect(() => {
    if (allComplete && !celebrated && details) {
      setCelebrated(true);
      playSound("complete");
      fireConfetti("big");
    }
  }, [allComplete, celebrated, details]);

  const needsReexport = useMemo(() => {
    if (!details || dismissedReexport) return false;
    return details.books.some((book) => {
      const bookAssignments = details.assignments.filter((a) => a.bookId === book.id);
      if (bookAssignments.length === 0) return false;
      const today = new Date().toISOString().split("T")[0];
      const expected = bookAssignments.find((a) => a.date >= today) ??
        bookAssignments[bookAssignments.length - 1];
      const expectedPage = expected.date <= today ? expected.endPage : expected.startPage - 1;
      return Math.abs(book.currentPage - expectedPage) > 10;
    });
  }, [details, dismissedReexport]);

  if (details === undefined) {
    return (
      <motion.p
        className="text-zinc-500"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        Loading plan...
      </motion.p>
    );
  }

  if (planMissing) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Plan not found</h1>
        <p className="text-zinc-500">This reading plan may have been deleted.</p>
        <Button asChild>
          <Link href="/">Back to plans</Link>
        </Button>
      </div>
    );
  }

  const { plan, planBooks, books, assignments } = details;

  const schedule = buildFullSchedule({
    planId: plan.id,
    name: plan.name,
    startDate: plan.startDate,
    targetEndDate: plan.targetEndDate,
    layoutMode: plan.layoutMode,
    activeDays: plan.activeDays as WeekdayKey[],
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
  });

  const totalPages = books.reduce((s, b) => s + b.totalPages, 0);
  const currentPages = books.reduce((s, b) => s + b.currentPage, 0);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await regeneratePlanSchedule(plan.id);
      playSound("success");
      setExportOpen(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to recalculate schedule");
    } finally {
      setRecalculating(false);
    }
  };

  const handleAdjust = async (updates: {
    targetEndDate: string;
    activeDays: WeekdayKey[];
    preferredReadTime: string;
    pagesPerDayOverride: number | null;
  }) => {
    await updatePlan(plan.id, updates);
    await regeneratePlanSchedule(plan.id);
    playSound("success");
    setExportOpen(true);
  };

  const handleDelete = async (removeCalendarEvents: boolean) => {
    setDeleting(true);
    try {
      if (removeCalendarEvents) {
        try {
          await deletePlanCalendarEvents(plan.id, assignments);
        } catch {
          // Continue with plan delete even if calendar cleanup fails
        }
      }
      playSound("delete");
      await deletePlan(plan.id);
      window.location.href = "/";
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleArchive = async () => {
    await updatePlanStatus(plan.id, "archived");
    playSound("success");
    window.location.href = "/";
  };

  return (
    <FadeIn>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700"
              onClick={() => playSound("swoosh")}
            >
              <ArrowLeft className="h-4 w-4" />
              All plans
            </Link>
            <h1 className="text-3xl font-bold">{plan.name}</h1>
            <p className="mt-1 text-zinc-500">
              {formatDisplayDate(plan.startDate)} → {formatDisplayDate(plan.targetEndDate)} ·{" "}
              {plan.layoutMode}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setAdjustOpen(true)}
              silent
            >
              <Settings2 className="h-4 w-4" />
              Adjust
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleRecalculate}
              disabled={recalculating}
              silent
            >
              <RefreshCw className={`h-4 w-4 ${recalculating ? "animate-spin" : ""}`} />
              Recalculate
            </Button>
            <Button className="gap-2" sound="export" onClick={() => setExportOpen(true)}>
              <Calendar className="h-4 w-4" />
              Export
            </Button>
            {plan.status === "active" && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleArchive}
                aria-label="Archive plan"
                silent
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              sound="delete"
              onClick={() => setDeleteOpen(true)}
              aria-label="Delete plan"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TodaysReading />

        {needsReexport && (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Your progress has drifted from the schedule. Recalculate and re-export to update your calendar.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setDismissedReexport(true)} silent>
                Dismiss
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  await handleRecalculate();
                  setDismissedReexport(true);
                }}
                silent
              >
                Recalculate & export
              </Button>
            </div>
          </div>
        )}

        {allComplete && (
          <BounceIn>
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
              >
                <Trophy className="h-8 w-8 text-amber-500" />
              </motion.div>
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                  Plan complete!
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  You finished every book in this plan. Amazing work!
                </p>
              </div>
            </div>
          </BounceIn>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overall progress</CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatedProgressBar
              current={currentPages}
              total={totalPages}
              label="All books"
            />
          </CardContent>
        </Card>

        <TimelinePreview
          segments={schedule.segments}
          planStart={plan.startDate}
          planEnd={schedule.projectedEndDate}
          totalPagesPerDay={schedule.totalPagesPerDay}
          feasibility={schedule.feasibility}
        />

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Books in this plan</h2>
          <StaggerList className="space-y-4">
            {books
              .sort((a, b) => {
                const oa = planBooks.find((p) => p.bookId === a.id)?.sortOrder ?? 0;
                const ob = planBooks.find((p) => p.bookId === b.id)?.sortOrder ?? 0;
                return oa - ob;
              })
              .map((book) => (
                <StaggerItem key={book.id}>
                  <Card>
                    <CardContent className="space-y-4 p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">{book.title}</h3>
                          <p className="text-sm text-zinc-500">{book.authors.join(", ")}</p>
                        </div>
                        <PaceIndicator book={book} assignments={assignments} />
                      </div>
                      <AnimatedProgressBar
                        current={book.currentPage}
                        total={book.totalPages}
                      />
                      {book.currentPage >= book.totalPages && (
                        <PopIn>
                          <Badge variant="success">Completed</Badge>
                        </PopIn>
                      )}
                      <PageUpdateForm
                        book={book}
                        onUpdate={async (bookId, page) => {
                          await updateBook(bookId, {
                            currentPage: page,
                            status: page >= book.totalPages ? "finished" : "reading",
                          });
                        }}
                      />
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
          </StaggerList>
        </div>

        <ExportDialog
          open={exportOpen}
          onOpenChange={setExportOpen}
          plan={plan}
          books={books}
          assignments={assignments}
          timezone={settings.timezone}
        />

        <AdjustPlanDialog
          open={adjustOpen}
          onOpenChange={setAdjustOpen}
          plan={plan}
          onSave={handleAdjust}
        />

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete plan?</DialogTitle>
              <DialogDescription>
                This permanently removes the plan and its assignments from Reading Scheduler.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={() => handleDelete(false)}
              >
                Delete plan only
              </Button>
              <Button
                variant="outline"
                disabled={deleting}
                onClick={() => handleDelete(true)}
              >
                Delete plan and calendar events
              </Button>
              <Button variant="ghost" onClick={() => setDeleteOpen(false)} silent>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FadeIn>
  );
}
