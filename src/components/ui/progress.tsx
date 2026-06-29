"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { shimmer?: boolean }
>(({ className, value, shimmer, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "relative h-full w-full flex-1 bg-indigo-600 transition-all duration-500 ease-out",
        shimmer && "progress-shimmer"
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

/** Progress bar with spring-animated fill. */
export function AnimatedProgress({
  value = 0,
  className,
  shimmer = true,
}: {
  value?: number;
  className?: string;
  shimmer?: boolean;
}) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const width = useTransform(spring, (v) => `${v}%`);

  React.useEffect(() => {
    spring.set(Math.min(100, Math.max(0, value)));
  }, [spring, value]);

  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800", className)}>
      <motion.div
        className={cn("absolute inset-y-0 left-0 rounded-full bg-indigo-600", shimmer && "progress-shimmer")}
        style={{ width }}
      />
    </div>
  );
}

export { Progress };
