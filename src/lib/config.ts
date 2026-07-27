/**
 * Slate-900. The single source for the app's default surface colour: it seeds
 * the user-adjustable background, the PWA manifest, and the browser theme bar.
 * Keep `--background` in `globals.css` in step, since that value applies
 * before React hydrates.
 */
export const DEFAULT_THEME_COLOR = "#0f172a";

/** A keyboard span, from its starting octave to the C that closes it. */
export type OctaveRange = readonly [start: number, end: number];

/**
 * Spans the octave slider can select, in slider order. Ranges end on the upper
 * C, so `[3, 4]` is one full octave plus its closing note.
 */
export const OCTAVE_RANGES: readonly OctaveRange[] = [
  [3, 4],
  [3, 5],
  [2, 5],
  [2, 6],
];

export const DEFAULT_OCTAVE_RANGE: OctaveRange = [3, 4];

/** Solfege samples are only recorded for the C3-C4 octave. */
export const SOLFEGE_OCTAVE_RANGE: OctaveRange = [3, 4];

/**
 * Zoom levels. The keyboard is laid out at a fixed rem size and scaled as a
 * whole, so every zoom value in the app comes from here.
 */
export const PIANO_SCALE = {
  MIN: 0.5,
  MAX: 2,
  STEP: 0.01,
  DEFAULT: 1.65,

  /** Applied on mount and resize; the first entry the width fits under wins. */
  BY_VIEWPORT: [
    { maxWidth: 640, scale: 1.15 },
    { maxWidth: 768, scale: 1.35 },
    { maxWidth: 1024, scale: 1.55 },
  ],

  /** Keyed by how many octave labels a range spans; wider ranges zoom out. */
  BY_OCTAVE_SPAN: {
    2: 1.5,
    3: 1.4,
    4: 1.0,
    5: 0.8,
  } as Record<number, number>,
};

/** Zoom that keeps a range spanning `span` octave labels on screen. */
export function scaleForOctaveSpan(span: number): number {
  return PIANO_SCALE.BY_OCTAVE_SPAN[span] ?? PIANO_SCALE.DEFAULT;
}

/** Zoom that suits a viewport of the given width. */
export function scaleForViewportWidth(width: number): number {
  const breakpoint = PIANO_SCALE.BY_VIEWPORT.find(
    (candidate) => width < candidate.maxWidth,
  );
  return breakpoint?.scale ?? PIANO_SCALE.DEFAULT;
}

export const PIANO_CONFIG = {
  WHITE_KEY_WIDTH_REM: 4,

  DEFAULT_OCTAVE_RANGE,
  DEFAULT_LABELS_ENABLED: true,
  DEFAULT_SOLFEGE_ENABLED: false,
  DEFAULT_BG_COLOR: DEFAULT_THEME_COLOR as string,
  DEFAULT_VOLUME: 0.75,

  /** How long to wait for a first interaction before loading samples anyway. */
  PRELOAD_DELAY_MS: 1500,

  ATTACK_MS: 10,
  FADE_OUT_MS: 800,
};

export const SOUND_OPTIONS = ["Piano", "Solfege"] as const;
export type SoundType = (typeof SOUND_OPTIONS)[number];
