"use client";

import { motion } from "framer-motion";

const PARTICLES = [
  { x: "5%", y: "10%", size: 8, delay: 0, duration: 14 },
  { x: "88%", y: "6%", size: 6, delay: 1.5, duration: 18 },
  { x: "70%", y: "60%", size: 7, delay: 0.8, duration: 16 },
  { x: "12%", y: "75%", size: 9, delay: 2.2, duration: 13 },
  { x: "42%", y: "20%", size: 5, delay: 0.3, duration: 20 },
  { x: "95%", y: "40%", size: 6, delay: 1, duration: 17 },
  { x: "3%", y: "48%", size: 7, delay: 2.8, duration: 15 },
  { x: "55%", y: "85%", size: 5, delay: 1.8, duration: 19 },
  { x: "78%", y: "25%", size: 4, delay: 0.6, duration: 21 },
  { x: "25%", y: "35%", size: 6, delay: 3, duration: 16 },
];

const FLOATING_ICONS = [
  { x: "18%", y: "18%", char: "📖", delay: 0, duration: 22 },
  { x: "82%", y: "72%", char: "✨", delay: 3, duration: 19 },
  { x: "60%", y: "8%", char: "📚", delay: 1.5, duration: 24 },
  { x: "35%", y: "88%", char: "🎯", delay: 2, duration: 20 },
];

export function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/90 via-violet-50/40 to-amber-50/50 dark:from-indigo-950/60 dark:via-violet-950/30 dark:to-amber-950/20" />

      <motion.div
        className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-500/15"
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-violet-400/25 blur-3xl dark:bg-violet-500/15"
        animate={{ x: [0, -50, 0], y: [0, -50, 0], scale: [1, 1.25, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-300/15 blur-3xl dark:bg-amber-500/10"
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />

      {PARTICLES.map((p, i) => (
        <motion.div
          key={`p-${i}`}
          className="absolute rounded-full bg-indigo-500/35 dark:bg-indigo-400/25"
          style={{ left: p.x, top: p.y, width: p.size, height: p.size }}
          animate={{ y: [0, -30, 0], x: [0, i % 2 === 0 ? 10 : -10, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
        />
      ))}

      {FLOATING_ICONS.map((icon, i) => (
        <motion.span
          key={`i-${i}`}
          className="absolute text-2xl opacity-20 dark:opacity-15"
          style={{ left: icon.x, top: icon.y }}
          animate={{
            y: [0, -18, 0],
            rotate: [0, 8, -8, 0],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{ duration: icon.duration, repeat: Infinity, ease: "easeInOut", delay: icon.delay }}
        >
          {icon.char}
        </motion.span>
      ))}
    </div>
  );
}
