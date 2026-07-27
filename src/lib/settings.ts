import {
  EFFECT_PRESETS,
  createEffectId,
  createEffectNode,
  type EffectNode,
  type EffectType,
  type EffectParams,
} from "./effects";
import { EFFECT_BUILDERS } from "./audio/effectSpecs";
import {
  DEFAULT_OCTAVE_RANGE,
  OCTAVE_RANGES,
  PIANO_CONFIG,
  PIANO_SCALE,
  SOUND_OPTIONS,
  type SoundType,
} from "./config";

/**
 * Bump the suffix when a change would make older stored settings wrong rather
 * than merely incomplete. Unknown keys are ignored and missing ones fall back
 * to defaults, so additive changes need no bump.
 */
export const SETTINGS_STORAGE_KEY = "solfege-piano.settings.v1";

/** Guards against a hand-edited or corrupted entry rebuilding a huge graph. */
const MAX_STORED_EFFECTS = 24;

export interface PianoSettings {
  volume: number;
  bgColor: string;
  soundType: SoundType;
  startOctave: number;
  endOctave: number;
  /**
   * `null` means "follow the viewport". A number is an explicit choice by the
   * user and wins over the responsive default from then on.
   */
  pianoScale: number | null;
  labelsEnabled: boolean;
  solfegeEnabled: boolean;
  effectChain: EffectNode[];
}

/**
 * Everything the "reset settings" control restores.
 *
 * The effect chain is deliberately excluded: rebuilding a rack is far more
 * work than re-picking a colour, so resetting preferences leaves it alone.
 */
export const DEFAULT_PREFERENCES: Omit<PianoSettings, "effectChain"> = {
  volume: PIANO_CONFIG.DEFAULT_VOLUME,
  bgColor: PIANO_CONFIG.DEFAULT_BG_COLOR,
  soundType: "Piano",
  startOctave: DEFAULT_OCTAVE_RANGE[0],
  endOctave: DEFAULT_OCTAVE_RANGE[1],
  pianoScale: null,
  labelsEnabled: PIANO_CONFIG.DEFAULT_LABELS_ENABLED,
  solfegeEnabled: PIANO_CONFIG.DEFAULT_SOLFEGE_ENABLED,
};

export function createDefaultSettings(): PianoSettings {
  return { ...DEFAULT_PREFERENCES, effectChain: [createEffectNode("Reverb")] };
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(value, min), max)
    : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/**
 * Rebuilds one effect node from stored data.
 *
 * Parameters are merged *over* the preset rather than used as-is: the audio
 * builders and the rack UI both read every field directly, with no per-field
 * fallbacks, so a node from an older version missing a field would otherwise
 * produce `undefined` deep inside the audio graph.
 *
 * Returns `null` for anything unrecognisable, which the caller drops.
 */
function parseEffectNode(value: unknown): EffectNode | null {
  if (!isRecord(value)) return null;

  const type = value.type;
  if (typeof type !== "string" || !(type in EFFECT_PRESETS)) return null;
  const effectType = type as EffectType;

  const preset = EFFECT_PRESETS[effectType];
  const stored = isRecord(value.params) ? value.params : {};
  const params: Record<string, unknown> = { ...preset };

  for (const key of Object.keys(preset)) {
    const storedValue = stored[key];
    if (key === "mode") {
      // A mode with no builder cannot be constructed, so keep the preset's.
      if (
        typeof storedValue === "string" &&
        storedValue in EFFECT_BUILDERS[effectType]
      ) {
        params.mode = storedValue;
      }
    } else if (
      typeof storedValue === "number" &&
      Number.isFinite(storedValue)
    ) {
      params[key] = storedValue;
    }
  }

  return {
    id: createEffectId(),
    type: effectType,
    enabled: readBoolean(value.enabled, true),
    // Every key of the preset was just copied or replaced in place, so the
    // shape matches `effectType` even though the loop erased that for TS.
    params: params as unknown as EffectParams,
  } as EffectNode;
}

function parseOctaveRange(
  value: Record<string, unknown>,
  fallback: PianoSettings,
): Pick<PianoSettings, "startOctave" | "endOctave"> {
  const { startOctave, endOctave } = value;
  const isSelectable = OCTAVE_RANGES.some(
    ([start, end]) => start === startOctave && end === endOctave,
  );

  return isSelectable
    ? { startOctave: startOctave as number, endOctave: endOctave as number }
    : { startOctave: fallback.startOctave, endOctave: fallback.endOctave };
}

/**
 * Validates stored settings field by field, substituting the default for
 * anything missing or out of range. Storage is user-editable and survives
 * deploys, so nothing here may be trusted.
 */
export function parseSettings(value: unknown): PianoSettings {
  const defaults = createDefaultSettings();
  if (!isRecord(value)) return defaults;

  const storedChain = Array.isArray(value.effectChain)
    ? value.effectChain
        .slice(0, MAX_STORED_EFFECTS)
        .map(parseEffectNode)
        .filter((node): node is EffectNode => node !== null)
    : null;

  return {
    volume: readNumber(value.volume, 0, 1, defaults.volume),
    bgColor:
      typeof value.bgColor === "string" && HEX_COLOR.test(value.bgColor)
        ? value.bgColor
        : defaults.bgColor,
    soundType: SOUND_OPTIONS.includes(value.soundType as SoundType)
      ? (value.soundType as SoundType)
      : defaults.soundType,
    ...parseOctaveRange(value, defaults),
    pianoScale:
      value.pianoScale === null || value.pianoScale === undefined
        ? null
        : readNumber(
            value.pianoScale,
            PIANO_SCALE.MIN,
            PIANO_SCALE.MAX,
            PIANO_SCALE.DEFAULT,
          ),
    labelsEnabled: readBoolean(value.labelsEnabled, defaults.labelsEnabled),
    solfegeEnabled: readBoolean(value.solfegeEnabled, defaults.solfegeEnabled),
    // An empty stored chain is a real choice; only a missing one falls back.
    effectChain: storedChain ?? defaults.effectChain,
  };
}

export function loadSettings(): PianoSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return parseSettings(raw === null ? null : JSON.parse(raw));
  } catch {
    // Private-mode restrictions, disabled storage, or malformed JSON.
    return createDefaultSettings();
  }
}

export function saveSettings(settings: PianoSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Quota or private-mode failures must not break playing the piano.
  }
}
