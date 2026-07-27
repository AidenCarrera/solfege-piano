/** Parameters every effect exposes: a dry/wet blend and a variant selector. */
export interface BaseEffectParams {
  mix: number;
  mode: string;
}

export interface ReverbParams extends BaseEffectParams {
  mode: "Native" | "Chamber";
  decay: number;
  preDelay: number;
  roomSize: number;
}

export interface DelayParams extends BaseEffectParams {
  mode: "Feedback" | "PingPong";
  delayTime: number;
  feedback: number;
}

export interface ModulationParams extends BaseEffectParams {
  mode: "Chorus" | "Vibrato" | "Phaser";
  frequency: number;
  depth: number;
}

export interface DistortionParams extends BaseEffectParams {
  mode: "Distortion" | "BitCrusher" | "Chebyshev";
  amount: number;
}

export interface FilterParams extends BaseEffectParams {
  mode: "AutoWah" | "AutoFilter";
  baseFrequency: number;
  octaves: number;
  sensitivity: number;
}

export interface CompressorParams extends BaseEffectParams {
  mode: "Compressor";
  threshold: number;
  ratio: number;
}

/**
 * The single source of truth pairing each effect with its parameters.
 * `EffectType`, the node union, and the preset table are all derived from it,
 * so adding an effect here forces every dependent table to be updated.
 */
export interface EffectParamsByType {
  Distortion: DistortionParams;
  Filter: FilterParams;
  Compressor: CompressorParams;
  Modulation: ModulationParams;
  Delay: DelayParams;
  Reverb: ReverbParams;
}

export type EffectType = keyof EffectParamsByType;
export type EffectParams = EffectParamsByType[EffectType];

/** The variants a given effect can switch between, e.g. `"Chorus" | "Vibrato"`. */
export type EffectMode<T extends EffectType = EffectType> =
  EffectParamsByType[T]["mode"];

/** Numeric (slider-adjustable) parameter names for a given effect. */
export type EffectParamField<T extends EffectType = EffectType> = Exclude<
  keyof EffectParamsByType[T],
  "mode"
>;

export interface EffectNodeOf<T extends EffectType> {
  id: string;
  type: T;
  enabled: boolean;
  params: EffectParamsByType[T];
}

/**
 * Discriminated on `type`, so narrowing a node also narrows its parameters.
 */
export type EffectNode = { [T in EffectType]: EffectNodeOf<T> }[EffectType];

/** A partial parameter edit, constrained to the effect being edited. */
export type EffectParamsUpdate<T extends EffectType = EffectType> = Partial<
  EffectParamsByType[T]
>;

/**
 * Default parameters for a newly added effect. Presets are the only source of
 * defaults: `createEffectNode` copies a complete parameter set, so consumers
 * can read every field without fallbacks.
 */
export const EFFECT_PRESETS: { [T in EffectType]: EffectParamsByType[T] } = {
  Distortion: { mix: 0.5, mode: "Distortion", amount: 0.5 },
  Filter: {
    mix: 1.0,
    mode: "AutoWah",
    baseFrequency: 150,
    octaves: 4,
    sensitivity: -20,
  },
  Compressor: {
    mix: 1.0,
    mode: "Compressor",
    threshold: -24,
    ratio: 4,
  },
  Modulation: {
    mix: 0.5,
    mode: "Chorus",
    frequency: 1.5,
    depth: 0.7,
  },
  Delay: {
    mix: 0.2,
    mode: "Feedback",
    delayTime: 0.25,
    feedback: 0.4,
  },
  Reverb: {
    mix: 0.15,
    mode: "Native",
    decay: 2.5,
    preDelay: 0.01,
    roomSize: 0.5,
  },
};

/**
 * Ids only have to be unique within a session — they key React lists and the
 * live audio-node map, and are never persisted — so a counter beats a random
 * string and stays readable in devtools.
 */
let nextEffectId = 0;

export function createEffectNode(type: EffectType): EffectNode {
  nextEffectId += 1;
  return {
    id: `effect-${nextEffectId}`,
    type,
    enabled: true,
    params: { ...EFFECT_PRESETS[type] },
    // TypeScript checks `type` and `params` independently and cannot see that
    // indexing the preset table with `type` keeps them in step.
  } as EffectNode;
}
