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

export type EffectMode<T extends EffectType = EffectType> =
  EffectParamsByType[T]["mode"];

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

export type EffectNode = { [T in EffectType]: EffectNodeOf<T> }[EffectType];

export type EffectParamsUpdate<T extends EffectType = EffectType> = Partial<
  EffectParamsByType[T]
>;

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

let nextEffectId = 0;

export function createEffectId(): string {
  nextEffectId += 1;
  return `effect-${nextEffectId}`;
}

export function createEffectNode(type: EffectType): EffectNode {
  return {
    id: createEffectId(),
    type,
    enabled: true,
    params: { ...EFFECT_PRESETS[type] },
    // TypeScript cannot infer the correlation between type and params.
  } as EffectNode;
}
