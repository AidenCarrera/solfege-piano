export const PIANO_CONFIG = {
  /* Layout & Visual */
  WHITE_KEY_WIDTH_REM: 4,
  DEFAULT_PIANO_SCALE: 1.5,
  DEFAULT_LABELS_ENABLED: true,
  DEFAULT_BG_COLOR: "#1d1522",

  /* Playback & Interaction */
  DEFAULT_VOLUME: 0.75,
  NOTE_RETRIGGER_COOLDOWN_MS: 50,
  KEY_HIGHLIGHT_DURATION_MS: 250,
  MAX_POLYPHONY: 128,

  /* Audio Envelope & Fade */
  FADE_OUT_MS: 450,
  FADE_OUT_BUFFER_MS: 20,

  /* Metadata */
  APP_TITLE: "Playable Piano",
};

export const SOUND_OPTIONS = ["Piano", "Solfege"] as const;
export type SoundType = (typeof SOUND_OPTIONS)[number];
