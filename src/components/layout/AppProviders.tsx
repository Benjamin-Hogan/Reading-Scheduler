"use client";

import { ToastProvider } from "@/components/ui/toast";
import { AnimatedBackground } from "@/components/layout/AnimatedBackground";
import { SoundSettingsSync } from "@/components/layout/SoundSettingsSync";
import { SyncProvider } from "@/components/layout/SyncProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SyncProvider>
        <SoundSettingsSync />
        <AnimatedBackground />
        {children}
      </SyncProvider>
    </ToastProvider>
  );
}
