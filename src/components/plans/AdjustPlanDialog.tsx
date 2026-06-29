"use client";

import { useState } from "react";
import type { ReadingPlan, WeekdayKey } from "@/lib/db/schema";
import { WEEKDAYS } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdjustPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ReadingPlan;
  onSave: (updates: {
    targetEndDate: string;
    activeDays: WeekdayKey[];
    preferredReadTime: string;
    pagesPerDayOverride: number | null;
  }) => Promise<void>;
}

export function AdjustPlanDialog({
  open,
  onOpenChange,
  plan,
  onSave,
}: AdjustPlanDialogProps) {
  const [endDate, setEndDate] = useState(plan.targetEndDate);
  const [activeDays, setActiveDays] = useState<WeekdayKey[]>(
    plan.activeDays as WeekdayKey[]
  );
  const [readTime, setReadTime] = useState(plan.preferredReadTime);
  const [pagesOverride, setPagesOverride] = useState(
    plan.pagesPerDayOverride?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDay = (day: WeekdayKey) => {
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (activeDays.length === 0) {
      setError("Select at least one active reading day");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        targetEndDate: endDate,
        activeDays,
        preferredReadTime: readTime,
        pagesPerDayOverride: pagesOverride ? parseInt(pagesOverride, 10) : null,
      });
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to adjust plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust schedule</DialogTitle>
          <DialogDescription>
            Update plan settings and recalculate remaining assignments from today.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adjust-end">Finish by</Label>
            <Input
              id="adjust-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Active reading days</Label>
            <div className="flex flex-wrap gap-3">
              {WEEKDAYS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={activeDays.includes(key)}
                    onCheckedChange={() => toggleDay(key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjust-time">Preferred read time</Label>
            <Input
              id="adjust-time"
              type="time"
              value={readTime}
              onChange={(e) => setReadTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adjust-pace">Pages per day override (optional)</Label>
            <Input
              id="adjust-pace"
              type="number"
              min={1}
              placeholder="Auto-calculated"
              value={pagesOverride}
              onChange={(e) => setPagesOverride(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} silent>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} silent>
            {saving ? "Saving..." : "Save & recalculate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
