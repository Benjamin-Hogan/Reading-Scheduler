"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Download, Loader2 } from "lucide-react";
import type { Book, DailyAssignment, ReadingPlan } from "@/lib/db/schema";
import { downloadIcsFile, generateIcsFile } from "@/lib/calendar/ics";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnimatedProgress } from "@/components/ui/progress";
import { playSound } from "@/lib/sounds";
import { fireConfetti } from "@/lib/celebrate";
import { BounceIn } from "@/components/layout/motion";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ReadingPlan;
  books: Book[];
  assignments: DailyAssignment[];
  timezone: string;
}

export function ExportDialog({
  open,
  onOpenChange,
  plan,
  books,
  assignments,
  timezone,
}: ExportDialogProps) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errorDetail?: string;
    activationUrl?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleIcsDownload = async () => {
    playSound("export");
    const ics = await generateIcsFile({
      assignments,
      books,
      planId: plan.id,
      preferredReadTime: plan.preferredReadTime,
      timezone,
    });
    downloadIcsFile(ics, plan.name);
    fireConfetti("small");
  };

  const handleGoogleExport = async () => {
    setExporting(true);
    setError(null);
    setResult(null);
    setProgress(20);
    playSound("whoosh");

    try {
      const res = await fetch("/api/calendar/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          preferredReadTime: plan.preferredReadTime,
          timezone,
          assignments,
          books,
        }),
      });

      setProgress(70);
      const data = await res.json();
      if (!res.ok) {
        playSound("error");
        setError(data.error ?? "Export failed");
        return;
      }

      setResult({
        success: data.success,
        failed: data.failed,
        errorDetail: data.errors?.[0],
        activationUrl: data.activationUrl,
      });
      setProgress(100);
      playSound("success");
      fireConfetti("medium");
    } catch {
      playSound("error");
      setError("Failed to export to Google Calendar");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
        >
          <DialogHeader>
            <DialogTitle>Export reading schedule</DialogTitle>
            <DialogDescription>
              Push {assignments.length} reading sessions to your calendar for &ldquo;{plan.name}&rdquo;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button className="w-full justify-start gap-2" variant="outline" sound="export" silent onClick={handleIcsDownload}>
              <Download className="h-4 w-4" />
              Download .ics file
            </Button>
            <p className="text-xs text-zinc-500">
              Works with Apple Calendar, Outlook, and Google Calendar (import)
            </p>

            <Button
              className="w-full justify-start gap-2"
              onClick={handleGoogleExport}
              disabled={exporting}
              silent
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              Export to Google Calendar
            </Button>

            {exporting && <AnimatedProgress value={progress} className="h-2" />}

            {error && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-red-600"
              >
                {error}
                {error.includes("Not connected") && (
                  <>
                    {" "}
                    <a href="/api/auth/google?returnTo=/settings" className="underline">
                      Connect Google
                    </a>
                  </>
                )}
              </motion.p>
            )}

            {result && (
              <BounceIn>
                {result.success > 0 ? (
                  <p className="text-sm font-medium text-emerald-600">
                    Exported {result.success} events
                    {result.failed > 0 && ` (${result.failed} failed)`}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-red-600">Export failed</p>
                )}
                {result.failed > 0 && result.errorDetail && (
                  <p className="mt-1 text-sm text-red-600">{result.errorDetail}</p>
                )}
                {result.activationUrl && (
                  <p className="mt-2 text-sm">
                    <a
                      href={result.activationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 underline"
                    >
                      Enable Google Calendar API
                    </a>
                  </p>
                )}
              </BounceIn>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
