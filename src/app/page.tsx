"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, CalendarDays, Sparkles } from "lucide-react";
import { usePlans } from "@/hooks/use-plans";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Book, PlanStatus } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedProgress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  FadeIn,
  StaggerList,
  StaggerItem,
  HoverLift,
  AnimatedNumber,
  SlideUp,
  PulseGlow,
} from "@/components/layout/motion";
import { EmptyState } from "@/components/layout/EmptyState";
import { formatDisplayDate } from "@/lib/scheduler/dates";
import { TodaysReading } from "@/components/reading/TodaysReading";
import { ReadingStatsCard } from "@/components/reading/ReadingStatsCard";
import { cn } from "@/lib/utils";

const TABS: { key: PlanStatus; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "archived", label: "Archived" },
];

function PlanCard({ planId }: { planId: string }) {
  const details = useLiveQuery(async () => {
    const plan = await db.readingPlans.get(planId);
    if (!plan) return null;
    const planBooks = await db.planBooks.where("planId").equals(planId).toArray();
    const books = (await db.books.bulkGet(planBooks.map((pb) => pb.bookId))).filter(
      (b): b is Book => b !== undefined
    );
    const totalPages = books.reduce((s, b) => s + b.totalPages, 0);
    const currentPages = books.reduce((s, b) => s + b.currentPage, 0);
    const progress = totalPages > 0 ? (currentPages / totalPages) * 100 : 0;
    return { plan, books, progress };
  }, [planId]);

  if (!details) return null;

  const { plan, books, progress } = details;

  return (
    <Link href={`/plans/${plan.id}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-xl">
        <motion.div
          className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-400"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{ backgroundSize: "200% 100%" }}
        />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{plan.name}</CardTitle>
            <Badge variant={plan.status === "active" ? "default" : "secondary"}>
              {plan.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-500">
            {books.length} book{books.length !== 1 ? "s" : ""} · {plan.layoutMode}
          </p>
          <p className="text-xs text-zinc-400">
            {formatDisplayDate(plan.startDate)} → {formatDisplayDate(plan.targetEndDate)}
          </p>
          <AnimatedProgress value={progress} className="h-2.5" />
          <p className="text-xs text-zinc-500">
            <AnimatedNumber value={Math.round(progress)} />% complete
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function PlansHubPage() {
  const { plans, isLoading } = usePlans();
  const [tab, setTab] = useState<PlanStatus>("active");

  const filteredPlans = plans.filter((p) => p.status === tab);

  return (
    <FadeIn>
      <div className="space-y-8">
        <SlideUp>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl gradient-text">Reading Plans</h1>
                <PulseGlow>
                  <Sparkles className="h-5 w-5 text-amber-400 animate-sparkle" />
                </PulseGlow>
              </div>
              <p className="mt-1 text-zinc-500">
                Plan once, live from your calendar. Update progress when you visit.
              </p>
            </div>
            <Button asChild size="lg" className="w-full gap-2 shadow-lg shadow-indigo-300/50 sm:w-auto dark:shadow-none" sound="pop">
              <Link href="/plans/new">
                <Plus className="h-4 w-4" />
                New plan
              </Link>
            </Button>
          </div>
        </SlideUp>

        <TodaysReading />
        <ReadingStatsCard />

        <div className="flex gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-800" role="tablist" aria-label="Plan status">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                tab === key
                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
              )}
            >
              {label}
              <span className="ml-1 text-xs text-zinc-400">
                ({plans.filter((p) => p.status === key).length})
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <motion.p
            className="text-zinc-500"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            Loading plans...
          </motion.p>
        ) : filteredPlans.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={
              tab === "active"
                ? "No active reading plans"
                : `No ${tab} plans`
            }
            description={
              tab === "active"
                ? "Add books to your library, create a plan, and export it to your calendar."
                : `Plans you mark as ${tab} will appear here.`
            }
          >
            {tab === "active" && (
              <>
                <Button asChild variant="outline">
                  <Link href="/books/new">Add books</Link>
                </Button>
                <Button asChild sound="pop">
                  <Link href="/plans/new">Create plan</Link>
                </Button>
              </>
            )}
          </EmptyState>
        ) : (
          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan) => (
              <StaggerItem key={plan.id}>
                <HoverLift>
                  <PlanCard planId={plan.id} />
                </HoverLift>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </div>
    </FadeIn>
  );
}
