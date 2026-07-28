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

/**
 * Roughly a phone held sideways.
 *
 * Too little height to show the controls and a playable keyboard at once, so
 * the layout stops trying: the panel starts collapsed, the keyboard is sized
 * to fill the screen on its own, and the page scrolls between them.
 */
export const SHORT_SCREEN_QUERY = "(max-height: 560px)";

/**
 * How many of `OCTAVE_RANGES` a short screen offers.
 *
 * The fourth spans 29 white keys, which even at the smallest zoom runs off
 * the side of a phone — offering it only produces an unplayable keyboard.
 */
export const SHORT_SCREEN_OCTAVE_RANGES = 3;

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

  /** Placeholder for the frames before the keyboard has been measured. */
  DEFAULT: 1.65,

  /**
   * Ceiling on the automatic fit, and the zoom a roomy desktop settles at.
   *
   * Fitting alone is not enough: given a whole viewport of spare height, a
   * single octave stretches to fill it, which reads as oversized and drags
   * the sustain controls up in size with it. Capping here means auto-fit only
   * ever shrinks the keyboard from its natural desktop size, never inflates
   * it. The slider still reaches `MAX` when asked directly.
   */
  FIT_MAX: 1.65,

  /**
   * Preferred ceiling on a short, landscape screen.
   *
   * That layout scrolls vertically, so shrinking the piano to fit the sustain
   * controls into the viewport makes the keys needlessly small. One octave is
   * most playable at its natural 1x size.
   */
  SHORT_SCREEN_FIT_MAX: 1,

  /**
   * A small width allowance for short screens. The piano row already scrolls
   * horizontally, so a few overflow pixels are a better trade than undersized
   * keys on two- and three-octave ranges.
   */
  SHORT_SCREEN_WIDTH_BOOST: 1.05,
};

/**
 * Space kept around the keyboard, in px.
 *
 * `TOP` is deliberately small: it is the gap under the control panel, and the
 * loading overlay hangs up into the panel rather than reserving a band of its
 * own. `BOTTOM` also covers the footer, which shares the first screen. The
 * sides grow with the viewport so a keyboard wide enough to be width-bound is
 * not flush against the edges of a large display.
 */
export const PIANO_INSET = {
  TOP_PX: 16,
  BOTTOM_PX: 56,
  SIDE_RATIO: 0.03,
  SIDE_MIN_PX: 12,
  SIDE_MAX_PX: 72,
};

export function clampScale(scale: number): number {
  return Math.min(Math.max(scale, PIANO_SCALE.MIN), PIANO_SCALE.MAX);
}

/** The side margin a viewport of this width earns, in px. */
export function sideInset(availableWidth: number): number {
  return Math.min(
    Math.max(availableWidth * PIANO_INSET.SIDE_RATIO, PIANO_INSET.SIDE_MIN_PX),
    PIANO_INSET.SIDE_MAX_PX,
  );
}

/**
 * The zoom at which a keyboard of `contentWidth` x `contentHeight` sits
 * comfortably in the space left over once its insets are taken out.
 *
 * Every size here is an *unscaled* layout size in px. Zoom is applied with a
 * transform, which leaves the layout box alone, so a measurement never has to
 * undo the zoom that is already on screen — and the result cannot feed back
 * into its own input.
 *
 * This replaces a table of zoom levels keyed by viewport width, which could
 * not know how many keys were on screen and so let a phone-sized viewport run
 * a full octave off the side of the display.
 */
export function fitScale(
  availableWidth: number,
  availableHeight: number,
  contentWidth: number,
  contentHeight: number,
): number {
  // A detached or not-yet-laid-out element would otherwise divide by zero.
  if (contentWidth <= 0 || contentHeight <= 0) return PIANO_SCALE.DEFAULT;

  const width = availableWidth - sideInset(availableWidth) * 2;
  const height = availableHeight - PIANO_INSET.TOP_PX - PIANO_INSET.BOTTOM_PX;

  return Math.min(
    clampScale(Math.min(width / contentWidth, height / contentHeight)),
    PIANO_SCALE.FIT_MAX,
  );
}

/**
 * Auto-fit for a short landscape screen, where the piano occupies its own
 * vertically scrollable section.
 *
 * Only key width is scarce in this layout. Applying the normal height fit
 * would also squeeze the keys to make room for the sustain controls and help
 * text, even though those controls are allowed to continue below the fold.
 */
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

  /** How long to wait for a first interaction before loading samples anyway. */
  PRELOAD_DELAY_MS: 1500,

  ATTACK_MS: 10,
  FADE_OUT_MS: 800,
};

export const SOUND_OPTIONS = ["Piano", "Solfege"] as const;
export type SoundType = (typeof SOUND_OPTIONS)[number];
