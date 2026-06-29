/**
 * UI sounds via Web Audio API — no audio files required.
 */

export type SoundName =
  | "click"
  | "success"
  | "celebrate"
  | "error"
  | "pop"
  | "pageTurn"
  | "whoosh"
  | "select"
  | "deselect"
  | "tick"
  | "fanfare"
  | "delete"
  | "swoosh"
  | "levelUp"
  | "complete"
  | "export";

let enabled = true;
let volumeScale = 1;
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

const MASTER_GAIN = 5;

export function setSoundEffectsEnabled(value: boolean) {
  enabled = value;
}

export function setSoundVolume(scale: number) {
  volumeScale = Math.max(0.25, Math.min(2, scale));
  if (masterGain) {
    masterGain.gain.value = MASTER_GAIN * volumeScale;
  }
}

export function isSoundEffectsEnabled() {
  return enabled;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioCtx = new Ctx();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = MASTER_GAIN * volumeScale;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.25,
  attack = 0.008,
  decay = 0.18,
  freqEnd?: number
) {
  const ctx = getAudioContext();
  if (!ctx || !masterGain || !enabled) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  if (freqEnd) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, now + decay);
  }
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + duration);
}

function chord(frequencies: number[], duration = 0.3, volume = 0.2) {
  frequencies.forEach((f, i) => {
    tone(f, duration, "sine", volume, 0.008, 0.25 + i * 0.04);
  });
}

function arpeggio(frequencies: number[], noteGap = 55, volume = 0.18) {
  frequencies.forEach((f, i) => {
    setTimeout(() => tone(f, 0.2, "triangle", volume, 0.005, 0.2), i * noteGap);
  });
}

const SOUNDS: Record<SoundName, () => void> = {
  click: () => tone(920, 0.08, "sine", 0.18, 0.003, 0.07),
  pop: () => {
    tone(440, 0.1, "triangle", 0.28, 0.003, 0.12);
    setTimeout(() => tone(880, 0.08, "triangle", 0.22, 0.003, 0.1), 35);
  },
  success: () => arpeggio([523, 659, 784], 50, 0.22),
  celebrate: () => {
    chord([523, 659, 784, 1047], 0.45, 0.2);
    setTimeout(() => arpeggio([784, 988, 1175], 45, 0.2), 140);
    setTimeout(() => chord([659, 784, 1047, 1319], 0.5, 0.18), 320);
  },
  error: () => {
    tone(200, 0.2, "square", 0.2, 0.01, 0.25);
    setTimeout(() => tone(160, 0.25, "square", 0.18, 0.01, 0.3), 90);
  },
  pageTurn: () => {
    tone(380, 0.06, "triangle", 0.16, 0.002, 0.05, 220);
    setTimeout(() => tone(300, 0.05, "triangle", 0.12, 0.002, 0.06, 180), 30);
  },
  whoosh: () => tone(600, 0.15, "sine", 0.2, 0.01, 0.2, 200),
  swoosh: () => {
    tone(800, 0.12, "sine", 0.18, 0.005, 0.15, 400);
    setTimeout(() => tone(500, 0.1, "sine", 0.14, 0.005, 0.12, 900), 40);
  },
  select: () => {
    tone(660, 0.07, "triangle", 0.2, 0.003, 0.08);
    setTimeout(() => tone(880, 0.06, "triangle", 0.16, 0.003, 0.07), 40);
  },
  deselect: () => tone(440, 0.08, "triangle", 0.14, 0.003, 0.1, 330),
  tick: () => tone(1200, 0.04, "sine", 0.14, 0.002, 0.05),
  fanfare: () => {
    arpeggio([392, 523, 659, 784, 988], 70, 0.22);
    setTimeout(() => chord([523, 659, 784, 1047], 0.55, 0.2), 400);
  },
  delete: () => {
    tone(300, 0.15, "square", 0.16, 0.01, 0.2, 150);
    setTimeout(() => tone(200, 0.2, "square", 0.14, 0.01, 0.25, 100), 80);
  },
  levelUp: () => arpeggio([440, 554, 659, 880], 60, 0.2),
  complete: () => {
    chord([523, 659, 784], 0.35, 0.22);
    setTimeout(() => tone(1047, 0.3, "sine", 0.24, 0.01, 0.35), 200);
  },
  export: () => {
    tone(523, 0.1, "triangle", 0.2, 0.005, 0.15);
    setTimeout(() => tone(659, 0.1, "triangle", 0.18, 0.005, 0.15), 80);
    setTimeout(() => tone(784, 0.15, "triangle", 0.22, 0.005, 0.2), 160);
  },
};

export function playSound(name: SoundName) {
  if (!enabled) return;
  try {
    SOUNDS[name]();
  } catch {
    // Audio may be blocked until user gesture
  }
}
