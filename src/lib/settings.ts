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

// Bump only for incompatible storage changes.
export const SETTINGS_STORAGE_KEY = "solfege-piano.settings.v1";

// Limit the graph a corrupted or hand-edited entry can create.
const MAX_STORED_EFFECTS = 24;

export interface PianoSettings {
  volume: number;
  bgColor: string;
  soundType: SoundType;
  startOctave: number;
  endOctave: number;
  /** `null` follows the responsive fit. */
  pianoScale: number | null;
  labelsEnabled: boolean;
  solfegeEnabled: boolean;
  effectChain: EffectNode[];
}

// Reset preserves the effect chain.
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

function parseEffectNode(value: unknown): EffectNode | null {
  if (!isRecord(value)) return null;

  const type = value.type;
  if (typeof type !== "string" || !(type in EFFECT_PRESETS)) return null;
  const effectType = type as EffectType;

  const preset = EFFECT_PRESETS[effectType];
  const stored = isRecord(value.params) ? value.params : {};
  // Merge over the preset so older entries gain newly added parameters.
  const params: Record<string, unknown> = { ...preset };

  for (const key of Object.keys(preset)) {
    const storedValue = stored[key];
    if (key === "mode") {
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
    // The loop preserves the preset's complete parameter shape.
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
    // An empty chain is intentional; only a missing chain uses the default.
    effectChain: storedChain ?? defaults.effectChain,
  };
}

export function loadSettings(): PianoSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return parseSettings(raw === null ? null : JSON.parse(raw));
  } catch {
    return createDefaultSettings();
  }
}

export function saveSettings(settings: PianoSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage failures should not interrupt playback.
  }
}
