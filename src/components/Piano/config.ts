export const PIANO_CONFIG = {
  WHITE_KEY_WIDTH_REM: 4,
  NOTE_COOLDOWN_MS: 50,
  NOTE_ACTIVE_DURATION_MS: 550,
  DEFAULT_VOLUME: 0.75,
  DEFAULT_LABELS_ENABLED: true,
  DEFAULT_PIANO_SCALE: 1.5,
  
  // Audio playback settings
  FADE_OUT_MS: 450,
  FADE_OUT_BUFFER_MS: 20, // Extra time after fade to ensure completion
  MAX_POLYPHONY: 128, // Maximum simultaneous voices
};

export const SOUND_OPTIONS = ["Piano", "Solfege"] as const;
export type SoundType = (typeof SOUND_OPTIONS)[number];