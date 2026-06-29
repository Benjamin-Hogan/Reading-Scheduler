"use client";

import { useBooks } from "@/hooks/use-books";
import { ScheduleWizard } from "@/components/plans/ScheduleWizard";
import { FadeIn } from "@/components/layout/motion";

export default function NewPlanPage() {
  const { books, isLoading } = useBooks();

  return (
    <FadeIn>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create reading plan</h1>
          <p className="text-zinc-500">
            Add books, set a timeframe, preview your schedule, and export to calendar
          </p>
        </div>
        {isLoading ? (
          <p className="text-zinc-500">Loading library...</p>
        ) : (
          <ScheduleWizard libraryBooks={books} />
        )}
      </div>
    </FadeIn>
  );
}
