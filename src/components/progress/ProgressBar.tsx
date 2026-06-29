"use client";

import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const value = total > 0 ? Math.min(100, (current / total) * 100) : 0;

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <span className="text-zinc-500">{Math.round(value)}%</span>
        </div>
      )}
      <Progress value={value} />
      <p className="text-xs text-zinc-500">
        Page {current} of {total}
      </p>
    </div>
  );
}

export function AnimatedProgressBar(props: ProgressBarProps) {
  return (
    <motion.div
      key={`${props.current}-${props.total}`}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <ProgressBar {...props} />
    </motion.div>
  );
}
