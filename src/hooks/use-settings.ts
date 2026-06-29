"use client";

import { useCallback, useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { AppSettings } from "@/lib/db/schema";
import { DEFAULT_ACTIVE_DAYS } from "@/lib/db/schema";
import { isStorageAvailable } from "@/lib/db/storage";
import { stampForWrite } from "@/lib/db/write-stamp";
import { scheduleSyncPush } from "@/hooks/use-sync";
import { getSyncState } from "@/lib/sync/engine";

const DEFAULT_SETTINGS: AppSettings = {
  id: "default",
  defaultActiveDays: [...DEFAULT_ACTIVE_DAYS],
  preferredReadTime: "19:00",
  timezone: "UTC",
  googleRefreshToken: null,
  soundEffectsEnabled: true,
  soundVolume: 100,
};

function browserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

async function ensureDefaultSettings(): Promise<void> {
  const existing = await db.settings.get("default");
  if (!existing) {
    await db.settings.put(
      stampForWrite(
        {
          ...DEFAULT_SETTINGS,
          timezone: browserTimezone(),
        },
        getSyncState().userId
      )
    );
  }
}

export function useSettings() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isStorageAvailable()) return;
    void ensureDefaultSettings();
  }, []);

  const settings = useLiveQuery(async () => {
    if (!isStorageAvailable()) {
      return DEFAULT_SETTINGS;
    }
    return (await db.settings.get("default")) ?? null;
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    if (!isStorageAvailable()) {
      setError("Storage unavailable — use http://localhost:3000");
      throw new Error("Storage unavailable");
    }
    try {
      await ensureDefaultSettings();
      const current = (await db.settings.get("default")) ?? {
        ...DEFAULT_SETTINGS,
        timezone: browserTimezone(),
      };
      await db.settings.put(
        stampForWrite({ ...current, ...updates, id: "default" }, getSyncState().userId)
      );
      scheduleSyncPush();
      setError(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save settings";
      setError(msg);
      throw e;
    }
  }, []);

  return {
    settings: settings ?? DEFAULT_SETTINGS,
    isLoading: settings === undefined,
    updateSettings,
    error,
  };
}
