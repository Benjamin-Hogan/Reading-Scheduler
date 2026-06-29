"use client";

import { useSyncBootstrap } from "@/hooks/use-sync";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useSyncBootstrap();
  return children;
}
