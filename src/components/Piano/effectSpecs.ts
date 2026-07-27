import type * as ToneType from "tone";
import type {
  CompressorParams,
  DelayParams,
  DistortionParams,
  EffectMode,
  EffectParamsByType,
  EffectType,
  FilterParams,
  ModulationParams,
  ReverbParams,
} from "@/lib/effects";
import { NativeBitCrusher, NativeFreeverb, NativeReverb } from "./audioEffects";

/** The live audio graph a builder attaches its nodes to. */
export interface EffectBuildContext {
  Tone: typeof ToneType;
  nativeContext: AudioContext;
}

/**
 * Uniform handle over a built effect. Each builder closes over its own
 * concrete node type, so `update` assigns statically-checked properties
 * instead of probing an untyped instance at runtime.
 */
export interface EffectAdapter<T extends EffectType = EffectType> {
  readonly input: ToneType.InputNode;
  readonly output: ToneType.OutputNode;
  update(params: EffectParamsByType[T]): void;
  dispose(): void;
}

export interface EffectBuilder<T extends EffectType> {
  /**
   * Nodes with an internal LFO produce silence when built against a suspended
   * context, so the caller defers creating them until it is running.
   */
  requiresRunningContext?: boolean;
  create(
    ctx: EffectBuildContext,
    params: EffectParamsByType[T],
  ): EffectAdapter<T>;
}

/**
 * Wraps a self-contained Tone node. Tone nodes route through themselves, so
 * they serve as both ends of the adapter.
 */
function toneAdapter<T extends EffectType, N extends ToneType.ToneAudioNode>(
  node: N,
  applyParams: (node: N, params: EffectParamsByType[T]) => void,
  params: EffectParamsByType[T],
): EffectAdapter<T> {
  applyParams(node, params);
  return {
    input: node,
    output: node,
    update: (next) => applyParams(node, next),
    dispose: () => node.dispose(),
  };
}

/** Bit depth falls as the user raises the amount, bottoming out at 1 bit. */
function amountToBits(amount: number): number {
  return Math.max(1, Math.round((1 - amount) * 8));
}

/** Chebyshev order sets how many harmonics are folded in. */
function amountToChebyshevOrder(amount: number): number {
  return Math.max(1, Math.round(amount * 50));
}

const reverbBuilders: Record<EffectMode<"Reverb">, EffectBuilder<"Reverb">> = {
  Native: {
    create({ Tone, nativeContext }, params) {
      const node = new NativeReverb(
        nativeContext,
        params.decay,
        params.preDelay,
        Tone,
      );
      const apply = (next: ReverbParams) => {
        node.mix = next.mix;
        node.decay = next.decay;
        node.preDelay = next.preDelay;
      };
      apply(params);
      return {
        input: node.input,
        output: node.output,
        update: apply,
        dispose: () => node.dispose(),
      };
    },
  },
  Chamber: {
    create({ Tone, nativeContext }, params) {
      const node = new NativeFreeverb(
        nativeContext,
        params.roomSize,
        params.preDelay,
        Tone,
      );
      const apply = (next: ReverbParams) => {
        node.mix = next.mix;
        node.roomSize = next.roomSize;
        node.preDelay = next.preDelay;
      };
      apply(params);
      return {
        input: node.input,
        output: node.output,
        update: apply,
        dispose: () => node.dispose(),
      };
    },
  },
};

function applyDelayParams(
  node: ToneType.FeedbackDelay | ToneType.PingPongDelay,
  params: DelayParams,
) {
  node.wet.value = params.mix;
  node.delayTime.value = params.delayTime;
  node.feedback.value = params.feedback;
}

const delayBuilders: Record<EffectMode<"Delay">, EffectBuilder<"Delay">> = {
  Feedback: {
    create: ({ Tone }, params) =>
      toneAdapter(
        new Tone.FeedbackDelay({
          delayTime: params.delayTime,
          feedback: params.feedback,
        }),
        applyDelayParams,
        params,
      ),
  },
  PingPong: {
    create: ({ Tone }, params) =>
      toneAdapter(
        new Tone.PingPongDelay({
          delayTime: params.delayTime,
          feedback: params.feedback,
        }),
        applyDelayParams,
        params,
      ),
  },
};

/** Chorus voices are spread around this delay; it is not user-adjustable. */
const CHORUS_DELAY_TIME_MS = 2.5;

const PHASER_SETTINGS = {
  octaves: 2,
  baseFrequency: 350,
  stages: 6,
  Q: 2,
} as const;

const modulationBuilders: Record<
  EffectMode<"Modulation">,
  EffectBuilder<"Modulation">
> = {
  Chorus: {
    requiresRunningContext: true,
    create: ({ Tone }, params) =>
      toneAdapter(
        new Tone.Chorus({
          frequency: params.frequency,
          delayTime: CHORUS_DELAY_TIME_MS,
          depth: params.depth,
        }).start(),
        (node, next: ModulationParams) => {
          node.wet.value = next.mix;
          node.frequency.value = next.frequency;
          node.depth = next.depth;
        },
        params,
      ),
  },
  Vibrato: {
    requiresRunningContext: true,
    create: ({ Tone }, params) =>
      toneAdapter(
        new Tone.Vibrato({
          frequency: params.frequency,
          depth: params.depth,
        }),
        (node, next: ModulationParams) => {
          node.wet.value = next.mix;
          node.frequency.value = next.frequency;
          node.depth.value = next.depth;
        },
        params,
      ),
  },
  Phaser: {
    requiresRunningContext: true,
    create: ({ Tone }, params) =>
      toneAdapter(
        new Tone.Phaser({
          frequency: params.frequency,
          ...PHASER_SETTINGS,
          wet: params.mix,
        }),
        // Phaser sweeps a fixed filter bank, so it has no depth control.
        (node, next: ModulationParams) => {
          node.wet.value = next.mix;
          node.frequency.value = next.frequency;
        },
        params,
      ),
  },
};

const distortionBuilders: Record<
  EffectMode<"Distortion">,
  EffectBuilder<"Distortion">
> = {
  Distortion: {
    create: ({ Tone }, params) =>
      toneAdapter(
        new Tone.Distortion({ distortion: params.amount }),
        (node, next: DistortionParams) => {
          node.wet.value = next.mix;
          node.distortion = next.amount;
        },
        params,
      ),
  },
  BitCrusher: {
    create({ Tone, nativeContext }, params) {
      const node = new NativeBitCrusher(
        nativeContext,
        amountToBits(params.amount),
        Tone,
      );
      const apply = (next: DistortionParams) => {
        node.mix = next.mix;
        node.bits = amountToBits(next.amount);
      };
      apply(params);
      return {
        input: node.input,
        output: node.output,
        update: apply,
        dispose: () => node.dispose(),
      };
    },
  },
  Chebyshev: {
    create: ({ Tone }, params) =>
      toneAdapter(
        new Tone.Chebyshev({ order: amountToChebyshevOrder(params.amount) }),
        (node, next: DistortionParams) => {
          node.wet.value = next.mix;
          node.order = amountToChebyshevOrder(next.amount);
        },
        params,
      ),
  },
};

/** Sweep rate of the auto-filter's LFO; the UI exposes no rate control. */
const AUTO_FILTER_FREQUENCY_HZ = 2;

const filterBuilders: Record<EffectMode<"Filter">, EffectBuilder<"Filter">> = {
  AutoWah: {
    create: ({ Tone }, params) =>
      toneAdapter(
        new Tone.AutoWah({
          baseFrequency: params.baseFrequency,
          octaves: params.octaves,
          sensitivity: params.sensitivity,
        }),
        (node, next: FilterParams) => {
          node.wet.value = next.mix;
          node.baseFrequency = next.baseFrequency;
          node.octaves = next.octaves;
          node.sensitivity = next.sensitivity;
        },
        params,
      ),
  },
  AutoFilter: {
    requiresRunningContext: true,
    create: ({ Tone }, params) =>
      toneAdapter(
        new Tone.AutoFilter({
          frequency: AUTO_FILTER_FREQUENCY_HZ,
          baseFrequency: params.baseFrequency,
          octaves: params.octaves,
        }).start(),
        // Sensitivity is an envelope-follower control that AutoFilter lacks.
        (node, next: FilterParams) => {
          node.wet.value = next.mix;
          node.baseFrequency = next.baseFrequency;
          node.octaves = next.octaves;
        },
        params,
      ),
  },
};

const COMPRESSOR_ATTACK_S = 0.003;
const COMPRESSOR_RELEASE_S = 0.25;

const compressorBuilders: Record<
  EffectMode<"Compressor">,
  EffectBuilder<"Compressor">
> = {
  Compressor: {
    create({ Tone, nativeContext }, params) {
      const comp = new Tone.Compressor({
        threshold: params.threshold,
        ratio: params.ratio,
        attack: COMPRESSOR_ATTACK_S,
        release: COMPRESSOR_RELEASE_S,
      });

      // Compressor has no wet control, so provide a parallel dry path.
      const inputGain = new Tone.Gain();
      const outputGain = new Tone.Gain();
      const wetGain = nativeContext.createGain();
      const dryGain = nativeContext.createGain();

      Tone.connect(inputGain, comp);
      Tone.connect(comp, wetGain);
      Tone.connect(inputGain, dryGain);
      Tone.connect(wetGain, outputGain);
      Tone.connect(dryGain, outputGain);

      const apply = (next: CompressorParams) => {
        comp.threshold.value = next.threshold;
        comp.ratio.value = next.ratio;
        wetGain.gain.value = next.mix;
        dryGain.gain.value = 1 - next.mix;
      };
      apply(params);

      return {
        input: inputGain,
        output: outputGain,
        update: apply,
        dispose: () => {
          comp.dispose();
          inputGain.dispose();
          outputGain.dispose();
          wetGain.disconnect();
          dryGain.disconnect();
        },
      };
    },
  },
};

/**
 * Every buildable effect, keyed by type and then mode. Switching an effect's
 * mode selects a different node topology, so the chain disposes and rebuilds
 * rather than trying to update in place.
 */
export const EFFECT_BUILDERS: {
  [T in EffectType]: Record<EffectMode<T>, EffectBuilder<T>>;
} = {
  Reverb: reverbBuilders,
  Delay: delayBuilders,
  Modulation: modulationBuilders,
  Distortion: distortionBuilders,
  Filter: filterBuilders,
  Compressor: compressorBuilders,
};
