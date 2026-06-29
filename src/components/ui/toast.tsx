"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { fireConfetti } from "@/lib/celebrate";
import { playSound } from "@/lib/sounds";

export type ToastVariant = "success" | "error";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id"> & { celebrate?: boolean }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function fireCelebrate() {
  fireConfetti("medium");
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    ({ celebrate, ...opts }: Omit<Toast, "id"> & { celebrate?: boolean }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((t) => [...t, { ...opts, id }]);
      if (opts.variant === "success") {
        playSound(celebrate ? "celebrate" : "success");
      } else if (opts.variant === "error") {
        playSound("error");
      }
      if (celebrate) fireCelebrate();
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 32, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, x: 100, scale: 0.9, rotate: 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg ${
                t.variant === "success"
                  ? "border-emerald-200 bg-white dark:border-emerald-900 dark:bg-zinc-950"
                  : "border-red-200 bg-white dark:border-red-900 dark:bg-zinc-950"
              }`}
            >
              {t.variant === "success" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-sm text-zinc-500">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  // Safe fallback if provider is missing (avoids white-screen crash)
  if (!ctx) {
    return {
      toast: () => {},
    };
  }
  return ctx;
}
