"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { BarChart3 } from "lucide-react";
import { computeReadingStats } from "@/lib/reading/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/layout/motion";

export function ReadingStatsCard() {
  const stats = useLiveQuery(() => computeReadingStats(), []);

  if (stats === undefined) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          Reading stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-indigo-600">
              <AnimatedNumber value={stats.pagesThisWeek} />
            </p>
            <p className="text-xs text-zinc-500">Pages this week</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-600">
              <AnimatedNumber value={stats.booksFinished} />
            </p>
            <p className="text-xs text-zinc-500">Books finished</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-indigo-600">
              <AnimatedNumber value={stats.activePlans} />
            </p>
            <p className="text-xs text-zinc-500">Active plans</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
