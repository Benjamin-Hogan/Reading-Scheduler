"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { getTodaysReading } from "@/lib/reading/today";
import { buildReadingSummary } from "@/lib/calendar/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/layout/motion";

export function TodaysReading() {
  const items = useLiveQuery(() => getTodaysReading(), []);

  if (items === undefined || items.length === 0) return null;

  return (
    <FadeIn>
      <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            Today&apos;s reading
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map(({ plan, book, assignment }) => (
            <div
              key={`${plan.id}-${book.id}`}
              className="flex flex-col gap-1 rounded-lg bg-white/80 p-3 dark:bg-zinc-900/80 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{book.title}</p>
                <p className="text-sm text-zinc-500">
                  {buildReadingSummary(book, assignment)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{plan.name}</Badge>
                <Link
                  href={`/plans/${plan.id}`}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  View plan
                </Link>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
