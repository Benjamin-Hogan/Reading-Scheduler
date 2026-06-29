"use client";

import { useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";
import { setSoundEffectsEnabled, setSoundVolume } from "@/lib/sounds";

/** Keeps the sound module in sync with persisted settings. */
export function SoundSettingsSync() {
  const { settings } = useSettings();

  useEffect(() => {
    setSoundEffectsEnabled(settings.soundEffectsEnabled ?? true);
    setSoundVolume((settings.soundVolume ?? 100) / 100);
  }, [settings.soundEffectsEnabled, settings.soundVolume]);

  return null;
}
