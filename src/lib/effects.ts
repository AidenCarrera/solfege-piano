export type EffectType = "AutoWah" | "Chorus" | "Delay" | "Reverb";

export interface BaseEffectParams {
  mix: number;
}

export interface ReverbParams extends BaseEffectParams {
  decay: number;
  preDelay: number;
}

export interface DelayParams extends BaseEffectParams {
  delayTime: number;
  feedback: number;
}

export interface ChorusParams extends BaseEffectParams {
  frequency: number;
  depth: number;
}


export interface AutoWahParams extends BaseEffectParams {
  baseFrequency: number;
  octaves: number;
  sensitivity: number;
}

export type EffectParams =
  | ReverbParams
  | DelayParams
  | ChorusParams
  | AutoWahParams;

export interface EffectNode {
  id: string; // Unique ID for drag-and-drop
  type: EffectType;
  enabled: boolean;
  params: EffectParams;
}

export const EFFECT_PRESETS: Record<EffectType, EffectParams> = {
  AutoWah: { mix: 1.0, baseFrequency: 150, octaves: 4, sensitivity: -20 } as AutoWahParams,
  Chorus: { mix: 0.5, frequency: 1.5, depth: 0.7 } as ChorusParams,
  Delay: { mix: 0.2, delayTime: 0.25, feedback: 0.4 } as DelayParams,
  Reverb: { mix: 0.15, decay: 2.5, preDelay: 0.01 } as ReverbParams,
};

export function createEffectNode(type: EffectType): EffectNode {
  return {
    id: `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    enabled: true,
    params: { ...EFFECT_PRESETS[type] },
  };
}
