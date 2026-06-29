"use client";

import { ToastProvider } from "@/components/ui/toast";
import { AnimatedBackground } from "@/components/layout/AnimatedBackground";
import { SoundSettingsSync } from "@/components/layout/SoundSettingsSync";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SoundSettingsSync />
      <AnimatedBackground />
      {children}
    </ToastProvider>
  );
}
