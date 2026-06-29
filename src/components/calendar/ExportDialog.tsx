"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Copy, Download, Link2, Loader2, Rss } from "lucide-react";
import type { Book, DailyAssignment, ReadingPlan } from "@/lib/db/schema";
import { downloadIcsFile, generateIcsFile } from "@/lib/calendar/ics";
import {
  copyTextToClipboard,
  publishCalendarFeed,
} from "@/lib/calendar/feed-client";
import { usePlans } from "@/hooks/use-plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { updatePlan } = usePlans();
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errorDetail?: string;
    activationUrl?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedPublishing, setFeedPublishing] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [webcalUrl, setWebcalUrl] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"feed" | "webcal" | null>(null);

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

  const handlePublishFeed = async () => {
    setFeedPublishing(true);
    setFeedError(null);
    playSound("whoosh");

    try {
      const response = await publishCalendarFeed({
        plan,
        books,
        assignments,
        timezone,
        token: plan.calendarFeedToken,
      });

      await updatePlan(plan.id, { calendarFeedToken: response.token });
      setFeedUrl(response.feedUrl);
      setWebcalUrl(response.webcalUrl);
      playSound("success");
      fireConfetti("small");
    } catch (err) {
      playSound("error");
      setFeedError(err instanceof Error ? err.message : "Failed to publish feed");
    } finally {
      setFeedPublishing(false);
    }
  };

  const handleCopy = async (value: string, field: "feed" | "webcal") => {
    const copied = await copyTextToClipboard(value);
    if (copied) {
      setCopiedField(field);
      playSound("pop");
      window.setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const activeFeedUrl =
    feedUrl ??
    (plan.calendarFeedToken && origin
      ? `${origin}/api/calendar/feed/${plan.calendarFeedToken}`
      : null);
  const activeWebcalUrl = webcalUrl ?? (activeFeedUrl ? activeFeedUrl.replace(/^https?:\/\//i, "webcal://") : null);
  const hasPublishedFeed = Boolean(plan.calendarFeedToken || feedUrl);

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

          <div className="space-y-5">
            <div className="space-y-3">
              <Button className="w-full justify-start gap-2" variant="outline" sound="export" silent onClick={handleIcsDownload}>
                <Download className="h-4 w-4" />
                Download .ics file
              </Button>
              <p className="text-xs text-zinc-500">
                One-time import for Apple Calendar, Outlook, and Google Calendar
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

            <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Rss className="h-4 w-4 text-indigo-600" />
                Subscribe to live feed
              </div>
              <p className="text-xs text-zinc-500">
                Publish a subscription URL that updates when you recalculate this plan.
                Re-publish after major changes if your calendar app does not refresh automatically.
              </p>

              <Button
                className="w-full justify-start gap-2"
                variant="outline"
                onClick={handlePublishFeed}
                disabled={feedPublishing}
                silent
              >
                {feedPublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                {hasPublishedFeed ? "Update subscription feed" : "Publish subscription feed"}
              </Button>

              {feedError && <p className="text-sm text-red-600">{feedError}</p>}

              {activeFeedUrl && (
                <BounceIn>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-500">HTTPS feed URL</label>
                    <div className="flex gap-2">
                      <Input readOnly value={activeFeedUrl} className="text-xs" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        silent
                        onClick={() => handleCopy(activeFeedUrl, "feed")}
                        aria-label="Copy feed URL"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {copiedField === "feed" && (
                      <p className="text-xs text-emerald-600">Feed URL copied</p>
                    )}

                    {activeWebcalUrl && (
                      <>
                        <label className="text-xs font-medium text-zinc-500">Webcal URL (Apple Calendar)</label>
                        <div className="flex gap-2">
                          <Input readOnly value={activeWebcalUrl} className="text-xs" />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            silent
                            onClick={() => handleCopy(activeWebcalUrl, "webcal")}
                            aria-label="Copy webcal URL"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        {copiedField === "webcal" && (
                          <p className="text-xs text-emerald-600">Webcal URL copied</p>
                        )}
                      </>
                    )}

                    <p className="text-xs text-zinc-500">
                      In Apple Calendar: File → New Calendar Subscription. In Outlook: Add calendar
                      from internet. Google Calendar web does not support subscribe URLs — use
                      download or direct Google export instead.
                    </p>
                  </div>
                </BounceIn>
              )}
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
