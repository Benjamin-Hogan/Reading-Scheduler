"use client";

import { motion } from "framer-motion";
import { differenceInCalendarDays, parseISO } from "date-fns";
import type { FeasibilityResult, TimelineSegment } from "@/lib/scheduler/types";
import { formatDisplayDate } from "@/lib/scheduler/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

interface TimelinePreviewProps {
  segments: TimelineSegment[];
  planStart: string;
  planEnd: string;
  totalPagesPerDay: number;
  feasibility: FeasibilityResult;
  onExtendDeadline?: () => void;
}

export function TimelinePreview({
  segments,
  planStart,
  planEnd,
  totalPagesPerDay,
  feasibility,
  onExtendDeadline,
}: TimelinePreviewProps) {
  const totalDays = Math.max(
    1,
    differenceInCalendarDays(parseISO(planEnd + "T12:00:00"), parseISO(planStart + "T12:00:00")) + 1
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Schedule preview</span>
          {!feasibility.feasible && (
            <Badge variant="warning">Needs adjustment</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!feasibility.feasible && feasibility.message && (
          <div className="space-y-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {feasibility.message}
            </p>
            {onExtendDeadline && feasibility.projectedEndDate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onExtendDeadline}
                silent
              >
                Extend deadline to {formatDisplayDate(feasibility.projectedEndDate)}
              </Button>
            )}
          </div>
        )}

        <div className="space-y-3">
          {segments.map((seg, i) => {
            const startOffset = differenceInCalendarDays(
              parseISO(seg.startDate + "T12:00:00"),
              parseISO(planStart + "T12:00:00")
            );
            const duration =
              differenceInCalendarDays(
                parseISO(seg.endDate + "T12:00:00"),
                parseISO(seg.startDate + "T12:00:00")
              ) + 1;
            const left = (startOffset / totalDays) * 100;
            const width = Math.max((duration / totalDays) * 100, 4);
            const color = COLORS[i % COLORS.length];

            return (
              <div key={seg.bookId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{seg.title}</span>
                  <span className="text-zinc-500">{seg.pagesPerDay} pp/day</span>
                </div>
                <div className="relative h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <motion.div
                    initial={{ width: 0, opacity: 0, scaleY: 0.5 }}
                    animate={{ width: `${width}%`, opacity: 1, scaleY: 1 }}
                    transition={{ type: "spring", stiffness: 120, damping: 18, delay: i * 0.08 }}
                    className={`absolute top-1 bottom-1 rounded-md ${color}`}
                    style={{ left: `${left}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  {formatDisplayDate(seg.startDate)} → {formatDisplayDate(seg.endDate)}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 border-t pt-4 text-sm text-zinc-600 dark:text-zinc-400">
          <span>Avg {totalPagesPerDay} pages/day</span>
          <span>Projected end: {formatDisplayDate(feasibility.projectedEndDate)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
