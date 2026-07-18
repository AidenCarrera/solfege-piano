export const PIANO_CONFIG = {
  WHITE_KEY_WIDTH_REM: 4,
  DEFAULT_PIANO_SCALE: 1.5,
  DEFAULT_OCTAVE_RANGE: [3, 4],
  DEFAULT_LABELS_ENABLED: true,
  DEFAULT_SOLFEGE_ENABLED: false,
  DEFAULT_BG_COLOR: "#0f172a",

  DEFAULT_VOLUME: 0.75,
  KEY_HIGHLIGHT_DURATION_MS: 250,
  MAX_POLYPHONY: 128,

  ATTACK_MS: 10,
  FADE_OUT_MS: 800,
};

export const SOUND_OPTIONS = ["Piano", "Solfege"] as const;
export type SoundType = (typeof SOUND_OPTIONS)[number];

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "https://solfegepiano.vercel.app");
