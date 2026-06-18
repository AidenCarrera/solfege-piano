export type EffectType = "Distortion" | "Filter" | "Compressor" | "Modulation" | "Delay" | "Reverb";

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

export type EffectParams =
  | ReverbParams
  | DelayParams
  | ModulationParams
  | DistortionParams
  | FilterParams
  | CompressorParams;

export interface EffectNode {
  id: string; // Unique ID for drag-and-drop
  type: EffectType;
  enabled: boolean;
  params: EffectParams;
}

export const EFFECT_PRESETS: Record<EffectType, EffectParams> = {
  Distortion: { mix: 0.5, mode: "Distortion", amount: 0.5 } as DistortionParams,
  Filter: { mix: 1.0, mode: "AutoWah", baseFrequency: 150, octaves: 4, sensitivity: -20 } as FilterParams,
  Compressor: { mix: 1.0, mode: "Compressor", threshold: -24, ratio: 4 } as CompressorParams,
  Modulation: { mix: 0.5, mode: "Chorus", frequency: 1.5, depth: 0.7 } as ModulationParams,
  Delay: { mix: 0.2, mode: "Feedback", delayTime: 0.25, feedback: 0.4 } as DelayParams,
  Reverb: { mix: 0.15, mode: "Native", decay: 2.5, preDelay: 0.01, roomSize: 0.5 } as ReverbParams,
};

export function createEffectNode(type: EffectType): EffectNode {
  return {
    id: `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    enabled: true,
    params: { ...EFFECT_PRESETS[type] },
  };
}
