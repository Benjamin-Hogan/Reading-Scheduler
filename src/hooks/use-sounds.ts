"use client";

import { useCallback } from "react";
import { playSound, type SoundName } from "@/lib/sounds";

export function useSounds() {
  const play = useCallback((name: SoundName) => {
    playSound(name);
  }, []);

  return { play };
}
