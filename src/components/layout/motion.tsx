"use client";

import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

function motionProps(reduced: boolean, animated: Record<string, unknown>) {
  return reduced ? { initial: false, animate: {}, transition: { duration: 0 } } : animated;
}

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.div
      {...motionProps(reduced, {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.35, delay, ease: "easeOut" },
      })}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 22, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function BounceIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 18, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PopIn({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 600, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideUp({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 24, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SlideIn({
  children,
  className,
  direction = "left",
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "left" | "right";
}) {
  const x = direction === "left" ? -40 : 40;
  return (
    <motion.div
      initial={{ opacity: 0, x }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -x }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StepTransition({
  stepKey,
  children,
  className,
  direction = 1,
}: {
  stepKey: string | number;
  children: React.ReactNode;
  className?: string;
  direction?: number;
}) {
  const enterX = direction * 60;
  const exitX = direction * -60;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, x: enterX, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: exitX, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function StaggerList({
  children,
  className,
  stagger = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20, scale: 0.96 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 24 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Float({
  children,
  className,
  duration = 3,
  distance = 10,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
}) {
  return (
    <motion.div
      animate={{ y: [-distance / 2, distance / 2, -distance / 2] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Wiggle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      animate={{ rotate: [0, -4, 4, -3, 3, 0] }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PulseGlow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      animate={{
        opacity: [0.7, 1, 0.7],
        scale: [1, 1.03, 1],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.div
      whileHover={
        reduced
          ? undefined
          : {
              y: -6,
              scale: 1.02,
              transition: { type: "spring", stiffness: 400, damping: 18 },
            }
      }
      whileTap={reduced ? undefined : { scale: 0.96 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function Shake({
  trigger,
  children,
  className,
}: {
  trigger: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      animate={trigger ? { x: [0, -8, 8, -6, 6, 0] } : {}}
      transition={{ duration: 0.4 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedNumber({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const spring = useSpring(0, { stiffness: 120, damping: 18 });
  const display = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span
      className={className}
      key={value}
      initial={{ scale: 1.3, color: "#4f46e5" }}
      animate={{ scale: 1, color: "inherit" }}
      transition={{ type: "spring", stiffness: 500, damping: 20 }}
    >
      {display}
    </motion.span>
  );
}
