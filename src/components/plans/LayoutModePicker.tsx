"use client";

import { motion } from "framer-motion";
import type { LayoutMode } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { playSound } from "@/lib/sounds";
import { Layers, ListOrdered, Shuffle } from "lucide-react";

const modes: { value: LayoutMode; label: string; description: string; icon: typeof Layers }[] = [
  {
    value: "parallel",
    label: "All at once",
    description: "Read every book during the same time period",
    icon: Layers,
  },
  {
    value: "sequential",
    label: "One after another",
    description: "Finish each book before starting the next",
    icon: ListOrdered,
  },
  {
    value: "custom",
    label: "Custom order",
    description: "Drag to set the order, then read sequentially",
    icon: Shuffle,
  },
];

interface LayoutModePickerProps {
  value: LayoutMode;
  onChange: (mode: LayoutMode) => void;
}

export function LayoutModePicker({ value, onChange }: LayoutModePickerProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {modes.map((mode) => {
        const Icon = mode.icon;
        const selected = value === mode.value;
        return (
          <motion.button
            key={mode.value}
            type="button"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              playSound("click");
              onChange(mode.value);
            }}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors",
              selected
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
            )}
          >
            <Icon className={cn("mb-2 h-5 w-5", selected ? "text-indigo-600" : "text-zinc-400")} />
            <p className="font-medium">{mode.label}</p>
            <p className="mt-1 text-xs text-zinc-500">{mode.description}</p>
          </motion.button>
        );
      })}
    </div>
  );
}
