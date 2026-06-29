"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import type { Book, LayoutMode, WeekdayKey, PlanTemplate } from "@/lib/db/schema";
import { DEFAULT_ACTIVE_DAYS, WEEKDAYS } from "@/lib/db/schema";
import { buildFullSchedule } from "@/lib/scheduler";
import { usePlans } from "@/hooks/use-plans";
import { useSettings } from "@/hooks/use-settings";
import { BookCard } from "@/components/books/BookCard";
import { BookQueue } from "@/components/plans/BookQueue";
import { LayoutModePicker } from "@/components/plans/LayoutModePicker";
import { TimelinePreview } from "@/components/plans/TimelinePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StepTransition, BounceIn } from "@/components/layout/motion";
import { playSound } from "@/lib/sounds";
import { fireConfetti } from "@/lib/celebrate";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = ["Books", "Timeframe", "Layout", "Rhythm", "Preview"];

interface ScheduleWizardProps {
  libraryBooks: Book[];
}

export function ScheduleWizard({ libraryBooks }: ScheduleWizardProps) {
  const router = useRouter();
  const { savePlan } = usePlans();
  const { settings } = useSettings();

  const [step, setStep] = useState(0);
  const [stepDirection, setStepDirection] = useState(1);
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);
  const [planName, setPlanName] = useState("");
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return formatDate(d);
  });
  const [pagesPerDayOverride, setPagesPerDayOverride] = useState("");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("parallel");
  const [activeDays, setActiveDays] = useState<WeekdayKey[]>([...DEFAULT_ACTIVE_DAYS]);
  const [readTime, setReadTime] = useState(settings.preferredReadTime);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const previewPlanId = "preview";

  const schedule = useMemo(() => {
    if (selectedBooks.length === 0) return null;
    return buildFullSchedule({
      planId: previewPlanId,
      name: planName || "Reading Plan",
      startDate,
      targetEndDate: endDate,
      layoutMode,
      activeDays,
      preferredReadTime: readTime,
      pagesPerDayOverride: pagesPerDayOverride ? parseInt(pagesPerDayOverride, 10) : null,
      books: selectedBooks.map((b, i) => ({
        bookId: b.id,
        title: b.title,
        totalPages: b.totalPages,
        currentPage: b.currentPage,
        sortOrder: i,
      })),
    });
  }, [
    selectedBooks,
    planName,
    startDate,
    endDate,
    layoutMode,
    activeDays,
    readTime,
    pagesPerDayOverride,
  ]);

  const toggleBook = (book: Book) => {
    const isSelected = selectedBooks.some((b) => b.id === book.id);
    playSound(isSelected ? "deselect" : "select");
    setSelectedBooks((prev) =>
      isSelected ? prev.filter((b) => b.id !== book.id) : [...prev, book]
    );
  };

  const toggleDay = (day: WeekdayKey) => {
    playSound("tick");
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const goNext = () => {
    if (!canNext()) return;
    playSound("whoosh");
    setStepDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    playSound("swoosh");
    setStepDirection(-1);
    setStep((s) => s - 1);
  };

  const canNext = () => {
    if (step === 0) return selectedBooks.length > 0;
    if (step === 1) return startDate && endDate && startDate <= endDate;
    if (step === 3) return activeDays.length > 0;
    return true;
  };

  const handleSave = async () => {
    if (!schedule) return;
    setSaving(true);
    setSaveError(null);
    try {
      const planId = await savePlan({
        plan: {
          name: planName || `Reading Plan ${formatDate(new Date())}`,
          startDate,
          targetEndDate: endDate,
          layoutMode,
          activeDays,
          preferredReadTime: readTime,
          pagesPerDayOverride: pagesPerDayOverride ? parseInt(pagesPerDayOverride, 10) : null,
          status: "active",
        },
        planBooks: schedule.windows.map((w, i) => ({
          bookId: w.bookId,
          sortOrder: i,
          bookStartDate: w.startDate,
          bookEndDate: w.endDate,
        })),
        assignments: schedule.assignments.map((a) => ({
          bookId: a.bookId,
          date: a.date,
          startPage: a.startPage,
          endPage: a.endPage,
          pagesToRead: a.pagesToRead,
        })),
      });
      playSound("fanfare");
      fireConfetti("big");
      router.push(`/plans/${planId}?export=1`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const extendDeadline = () => {
    if (schedule?.feasibility.projectedEndDate) {
      setEndDate(schedule.feasibility.projectedEndDate);
      playSound("tick");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <motion.div
            key={s}
            className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
            title={s}
          >
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
              initial={{ width: "0%" }}
              animate={{ width: i <= step ? "100%" : "0%" }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: i <= step ? i * 0.05 : 0 }}
            />
            {i === step && (
              <motion.div
                className="absolute inset-0 rounded-full bg-white/30"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}
      </div>

      <p className="text-center text-sm font-medium text-indigo-600 dark:text-indigo-400">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      <StepTransition stepKey={step} direction={stepDirection}>
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Select books for this plan</h2>
            {libraryBooks.length === 0 ? (
              <p className="text-zinc-500">
                No books in your library yet.{" "}
                <a href="/books/new" className="text-indigo-600 underline">
                  Add some first
                </a>
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {libraryBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    selectable
                    selected={selectedBooks.some((b) => b.id === book.id)}
                    onSelect={toggleBook}
                  />
                ))}
              </div>
            )}
            {selectedBooks.length > 0 && (
              <BounceIn>
                <p className="text-sm font-medium text-indigo-600">
                  {selectedBooks.length} book{selectedBooks.length !== 1 ? "s" : ""} selected ✓
                </p>
              </BounceIn>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Set your timeframe</h2>
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan name</Label>
              <Input
                id="plan-name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Summer reading list"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start">Start date</Label>
                <Input
                  id="start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Finish by</Label>
                <Input
                  id="end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pace">Pages per day override (optional)</Label>
              <Input
                id="pace"
                type="number"
                min={1}
                placeholder="Auto-calculated from deadline"
                value={pagesPerDayOverride}
                onChange={(e) => setPagesPerDayOverride(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">How do you want to read these?</h2>
            <LayoutModePicker value={layoutMode} onChange={setLayoutMode} />
            {(layoutMode === "sequential" || layoutMode === "custom") && (
              <div className="space-y-2">
                <Label>Reading order</Label>
                <BookQueue
                  books={selectedBooks}
                  onReorder={setSelectedBooks}
                  onRemove={(id) => setSelectedBooks((b) => b.filter((x) => x.id !== id))}
                  draggable={layoutMode === "custom" || layoutMode === "sequential"}
                />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Reading rhythm</h2>
            {(settings.planTemplates ?? []).length > 0 && (
              <div className="space-y-2">
                <Label>Apply template</Label>
                <div className="flex flex-wrap gap-2">
                  {(settings.planTemplates ?? []).map((t: PlanTemplate) => (
                    <Button
                      key={t.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveDays([...(t.activeDays as WeekdayKey[])]);
                        setReadTime(t.preferredReadTime);
                        setLayoutMode(t.layoutMode);
                        if (t.pagesPerDayOverride) {
                          setPagesPerDayOverride(t.pagesPerDayOverride.toString());
                        }
                        playSound("tick");
                      }}
                      silent
                    >
                      {t.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Active reading days</Label>
              <div className="flex flex-wrap gap-3">
                {WEEKDAYS.map(({ key, label }) => (
                  <motion.label
                    key={key}
                    whileTap={{ scale: 0.95 }}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1 text-sm hover:border-indigo-200 hover:bg-indigo-50/50 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/30"
                  >
                    <Checkbox
                      checked={activeDays.includes(key)}
                      onCheckedChange={() => toggleDay(key)}
                    />
                    {label}
                  </motion.label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="read-time">Preferred read time (for calendar)</Label>
              <Input
                id="read-time"
                type="time"
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 4 && schedule && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Preview your schedule</h2>
            <TimelinePreview
              segments={schedule.segments}
              planStart={startDate}
              planEnd={schedule.projectedEndDate}
              totalPagesPerDay={schedule.totalPagesPerDay}
              feasibility={schedule.feasibility}
              onExtendDeadline={extendDeadline}
            />
            <p className="text-sm text-zinc-500">
              {schedule.assignments.length} reading sessions will be created
            </p>
            {saveError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">
                {saveError}
              </p>
            )}
          </div>
        )}
      </StepTransition>

      <div className="flex justify-between">
        <Button variant="outline" onClick={goBack} disabled={step === 0} silent>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        {step < 4 ? (
          <Button onClick={goNext} disabled={!canNext()} silent>
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving || !schedule} silent>
            {saving ? "Saving..." : "Create plan"}
          </Button>
        )}
      </div>
    </div>
  );
}
