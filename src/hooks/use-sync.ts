"use client";

import { useEffect, useState } from "react";
import {
  bootstrapSync,
  getSyncState,
  initSyncListeners,
  pullSync,
  pushSync,
  refreshSession,
  scheduleSyncPush,
  subscribeSyncState,
  syncNow,
  uploadLocalToCloud,
  type SyncState,
} from "@/lib/sync/engine";

export { scheduleSyncPush };

export function useSync() {
  const [syncState, setSyncState] = useState<SyncState>(() => getSyncState());

  useEffect(() => subscribeSyncState(setSyncState), []);

  return {
    ...syncState,
    refreshSession,
    pullSync,
    pushSync,
    syncNow,
    uploadLocalToCloud,
  };
}

export function useSyncBootstrap() {
  useEffect(() => {
    const cleanupListeners = initSyncListeners();
    void bootstrapSync();
    return cleanupListeners;
  }, []);
}
