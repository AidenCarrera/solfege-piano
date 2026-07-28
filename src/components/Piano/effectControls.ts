import type {
  EffectMode,
  EffectParamField,
  EffectParamsByType,
  EffectType,
} from "@/lib/effects";

export interface EffectModeOption<T extends EffectType> {
  value: EffectMode<T>;
  label: string;
}

export const EFFECT_MODES: {
  [T in EffectType]: readonly EffectModeOption<T>[];
} = {
  Reverb: [
    { value: "Native", label: "Convolver" },
    { value: "Chamber", label: "Chamber" },
  ],
  Delay: [
    { value: "Feedback", label: "Feedback" },
    { value: "PingPong", label: "Ping-Pong" },
  ],
  Modulation: [
    { value: "Chorus", label: "Chorus" },
    { value: "Vibrato", label: "Vibrato" },
    { value: "Phaser", label: "Phaser" },
  ],
  Distortion: [
    { value: "Distortion", label: "Overdrive" },
    { value: "BitCrusher", label: "BitCrusher" },
    { value: "Chebyshev", label: "Wavefolder" },
  ],
  Filter: [
    { value: "AutoWah", label: "AutoWah" },
    { value: "AutoFilter", label: "AutoFilter" },
  ],
  Compressor: [],
};

export interface ParamSliderSpec<T extends EffectType> {
  field: EffectParamField<T>;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  appliesTo?: readonly EffectMode<T>[];
}

const percent = (value: number) => `${Math.round(value * 100)}%`;
const milliseconds = (value: number) => `${Math.round(value * 1000)}ms`;
const seconds = (value: number) => `${value.toFixed(1)}s`;
const hertz = (value: number) => `${value}Hz`;

export const MIX_SLIDER_RANGE = { min: 0, max: 1, step: 0.01 } as const;
export const formatMix = percent;

export const EFFECT_PARAM_SLIDERS: {
  [T in EffectType]: readonly ParamSliderSpec<T>[];
} = {
  Reverb: [
    {
      field: "decay",
      label: "Decay",
      min: 0.5,
      max: 10,
      step: 0.1,
      format: seconds,
      appliesTo: ["Native"],
    },
    {
      field: "preDelay",
      label: "Pre-Delay",
      min: 0,
      max: 0.15,
      step: 0.005,
      format: milliseconds,
    },
    {
      field: "roomSize",
      label: "Room Size",
      min: 0,
      max: 1,
      step: 0.01,
      format: percent,
      appliesTo: ["Chamber"],
    },
  ],
  Delay: [
    {
      field: "delayTime",
      label: "Time",
      min: 0.01,
      max: 1,
      step: 0.01,
      format: milliseconds,
    },
    {
      field: "feedback",
      label: "Feedback",
      min: 0,
      max: 0.9,
      step: 0.01,
      format: percent,
    },
  ],
  Modulation: [
    {
      field: "frequency",
      label: "Rate",
      min: 0.1,
      max: 10,
      step: 0.1,
      format: (value) => `${value.toFixed(1)}Hz`,
    },
    {
      field: "depth",
      label: "Depth",
      min: 0,
      max: 1,
      step: 0.01,
      format: percent,
      appliesTo: ["Chorus", "Vibrato"],
    },
  ],
  Distortion: [
    {
      field: "amount",
      label: "Amount",
      min: 0,
      max: 1,
      step: 0.01,
      format: percent,
    },
  ],
  Compressor: [
    {
      field: "threshold",
      label: "Threshold",
      min: -60,
      max: 0,
      step: 1,
      format: (value) => `${value}dB`,
    },
    {
      field: "ratio",
      label: "Ratio",
      min: 1,
      max: 20,
      step: 0.5,
      format: (value) => `${value}:1`,
    },
  ],
  Filter: [
    {
      field: "baseFrequency",
      label: "Base Freq",
      min: 50,
      max: 2000,
      step: 10,
      format: hertz,
    },
    {
      field: "octaves",
      label: "Octaves",
      min: 1,
      max: 8,
      step: 0.5,
      format: (value) => `${value}`,
    },
  ],
};

export function readParam<T extends EffectType>(
  params: EffectParamsByType[T],
  field: EffectParamField<T>,
): number {
  return params[field] as number;
}
