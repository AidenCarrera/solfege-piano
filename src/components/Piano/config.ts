export const PIANO_CONFIG = {
  WHITE_KEY_WIDTH_REM: 4,
  NOTE_COOLDOWN_MS: 50,
  NOTE_ACTIVE_DURATION_MS: 150,
  DEFAULT_VOLUME: 0.75,
  DEFAULT_LABELS_ENABLED: true,
  DEFAULT_PIANO_SCALE: 1.5,
};

export const SOUND_OPTIONS = ["Piano", "Solfege"] as const;
export type SoundType = (typeof SOUND_OPTIONS)[number];
