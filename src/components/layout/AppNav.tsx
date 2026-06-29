"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, CalendarDays, Library, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { playSound } from "@/lib/sounds";

const navItems = [
  { href: "/", label: "Plans", icon: CalendarDays },
  { href: "/books", label: "Library", icon: Library },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-indigo-600"
            onClick={() => playSound("click")}
          >
            <motion.div
              whileHover={{ rotate: [-5, 5, 0] }}
              transition={{ duration: 0.4 }}
            >
              <BookOpen className="h-6 w-6" />
            </motion.div>
            <span className="hidden sm:inline">Reading Scheduler</span>
            <span className="sm:hidden">ReadPlan</span>
          </Link>
          <nav className="relative hidden items-center gap-1 md:flex">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  onClick={() => playSound("click")}
                  className={cn(
                    "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-indigo-700 dark:text-indigo-300"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active-desktop"
                      className="absolute inset-0 rounded-lg bg-indigo-50 dark:bg-indigo-950"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative h-4 w-4" />
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden dark:border-zinc-800 dark:bg-zinc-950/90"
        aria-label="Main navigation"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => playSound("click")}
                className={cn(
                  "relative flex min-h-14 min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-colors touch-manipulation",
                  active
                    ? "text-indigo-700 dark:text-indigo-300"
                    : "text-zinc-500 active:bg-zinc-100 dark:text-zinc-400 dark:active:bg-zinc-900"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active-mobile"
                    className="absolute inset-1 rounded-lg bg-indigo-50 dark:bg-indigo-950"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="relative h-5 w-5" />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
