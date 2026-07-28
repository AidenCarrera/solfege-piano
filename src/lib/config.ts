// Keep in sync with the pre-hydration value in globals.css.
export const DEFAULT_THEME_COLOR = "#0f172a";

export type OctaveRange = readonly [start: number, end: number];

// Ranges include the closing C of the final octave.
export const OCTAVE_RANGES: readonly OctaveRange[] = [
  [3, 4],
  [3, 5],
  [2, 5],
  [2, 6],
];

export const DEFAULT_OCTAVE_RANGE: OctaveRange = [3, 4];

export const SHORT_SCREEN_QUERY = "(max-height: 560px)";

// Exclude the widest, unplayable range on short screens.
export const SHORT_SCREEN_OCTAVE_RANGES = 3;

/** Solfege samples are only recorded for the C3-C4 octave. */
export const SOLFEGE_OCTAVE_RANGE: OctaveRange = [3, 4];

export const PIANO_SCALE = {
  MIN: 0.5,
  MAX: 2,
  STEP: 0.01,

  DEFAULT: 1.65,

  // Auto-fit may shrink the keyboard, but never enlarge it past this size.
  FIT_MAX: 1.65,

  SHORT_SCREEN_FIT_MAX: 1,

  // Prefer slight horizontal overflow to undersized keys.
  SHORT_SCREEN_WIDTH_BOOST: 1.05,
};

export const PIANO_INSET = {
  TOP_PX: 16,
  // Also reserves room for the in-flow footer.
  BOTTOM_PX: 56,
  SIDE_RATIO: 0.03,
  SIDE_MIN_PX: 12,
  SIDE_MAX_PX: 72,
};

export function clampScale(scale: number): number {
  return Math.min(Math.max(scale, PIANO_SCALE.MIN), PIANO_SCALE.MAX);
}

export function sideInset(availableWidth: number): number {
  return Math.min(
    Math.max(availableWidth * PIANO_INSET.SIDE_RATIO, PIANO_INSET.SIDE_MIN_PX),
    PIANO_INSET.SIDE_MAX_PX,
  );
}

export function fitScale(
  availableWidth: number,
  availableHeight: number,
  contentWidth: number,
  contentHeight: number,
): number {
  // Unscaled inputs avoid feedback from the CSS transform.
  if (contentWidth <= 0 || contentHeight <= 0) return PIANO_SCALE.DEFAULT;

  const width = availableWidth - sideInset(availableWidth) * 2;
  const height = availableHeight - PIANO_INSET.TOP_PX - PIANO_INSET.BOTTOM_PX;

  return Math.min(
    clampScale(Math.min(width / contentWidth, height / contentHeight)),
    PIANO_SCALE.FIT_MAX,
  );
}

// Short screens scroll vertically, so only width constrains the keyboard.
export function shortScreenFitScale(
  availableWidth: number,
  contentWidth: number,
): number {
  if (contentWidth <= 0) return PIANO_SCALE.DEFAULT;

  const width = availableWidth - sideInset(availableWidth) * 2;
  return Math.min(
    clampScale((width / contentWidth) * PIANO_SCALE.SHORT_SCREEN_WIDTH_BOOST),
    PIANO_SCALE.SHORT_SCREEN_FIT_MAX,
  );
}

export const PIANO_CONFIG = {
  WHITE_KEY_WIDTH_REM: 4,

  DEFAULT_OCTAVE_RANGE,
  DEFAULT_LABELS_ENABLED: true,
  DEFAULT_SOLFEGE_ENABLED: false,
  DEFAULT_BG_COLOR: DEFAULT_THEME_COLOR as string,
  DEFAULT_VOLUME: 0.75,

  PRELOAD_DELAY_MS: 1500,

  ATTACK_MS: 10,
  FADE_OUT_MS: 800,
};

export const SOUND_OPTIONS = ["Piano", "Solfege"] as const;
export type SoundType = (typeof SOUND_OPTIONS)[number];
