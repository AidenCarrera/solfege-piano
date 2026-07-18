import type * as ToneType from "tone";

function createImpulseResponse(
  context: AudioContext,
  duration: number,
  decay: number,
) {
  const sampleRate = context.sampleRate;
  const length = Math.max(1, sampleRate * duration);
  const impulse = context.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);
  for (let i = 0; i < length; i++) {
    const fade = Math.pow(1 - i / length, decay);
    left[i] = (Math.random() * 2 - 1) * fade;
    right[i] = (Math.random() * 2 - 1) * fade;
  }
  return impulse;
}

export class NativeReverb {
  input: ToneType.Gain;
  output: ToneType.Gain;
  private delayNode: DelayNode;
  private convolver: ConvolverNode;
  private wetGain: GainNode;
  private dryGain: GainNode;
  private context: AudioContext;
  private currentDecay: number;
  private impulseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    context: AudioContext,
    decay: number,
    preDelay: number,
    Tone: typeof ToneType,
  ) {
    this.context = context;
    this.currentDecay = decay;

    // Tone.Gain bridges Tone.js and native Web Audio graph boundaries.
    this.input = new Tone.Gain();
    this.output = new Tone.Gain();

    this.delayNode = context.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(preDelay, context.currentTime);

    this.convolver = context.createConvolver();
    this.convolver.buffer = createImpulseResponse(context, decay, 3.0);

    this.wetGain = context.createGain();
    this.dryGain = context.createGain();

    Tone.connect(this.input, this.delayNode);
    this.delayNode.connect(this.convolver);

    Tone.connect(this.input, this.dryGain);

    this.convolver.connect(this.wetGain);
    Tone.connect(this.wetGain, this.output);
    Tone.connect(this.dryGain, this.output);
  }

  set mix(value: number) {
    this.wetGain.gain.value = value;
    this.dryGain.gain.value = 1 - value;
  }

  set decay(value: number) {
    if (this.currentDecay !== value) {
      this.currentDecay = value;
      if (this.impulseTimer) clearTimeout(this.impulseTimer);
      this.impulseTimer = setTimeout(() => {
        this.convolver.buffer = createImpulseResponse(
          this.context,
          this.currentDecay,
          3.0,
        );
        this.impulseTimer = null;
      }, 120);
    }
  }

  set preDelay(value: number) {
    this.delayNode.delayTime.setValueAtTime(value, this.context.currentTime);
  }

  dispose() {
    if (this.impulseTimer) clearTimeout(this.impulseTimer);
    this.input.dispose();
    this.output.dispose();
    this.delayNode.disconnect();
    this.convolver.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
  }
}

function createCrusherCurve(bits: number) {
  const steps = Math.pow(2, bits);
  const curve = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) {
    const x = (i * 2) / 1024 - 1;
    curve[i] = Math.round(x * steps) / steps;
  }
  return curve;
}

export class NativeBitCrusher {
  input: ToneType.Gain;
  output: ToneType.Gain;
  private waveShaper: WaveShaperNode;
  private wetGain: GainNode;
  private dryGain: GainNode;

  constructor(context: AudioContext, bits: number, Tone: typeof ToneType) {
    this.input = new Tone.Gain();
    this.output = new Tone.Gain();

    this.waveShaper = context.createWaveShaper();
    this.waveShaper.curve = createCrusherCurve(bits);

    this.wetGain = context.createGain();
    this.dryGain = context.createGain();

    Tone.connect(this.input, this.waveShaper);
    this.waveShaper.connect(this.wetGain);
    Tone.connect(this.input, this.dryGain);

    Tone.connect(this.wetGain, this.output);
    Tone.connect(this.dryGain, this.output);
  }

  set bits(val: number) {
    this.waveShaper.curve = createCrusherCurve(val);
  }

  set mix(value: number) {
    this.wetGain.gain.value = value;
    this.dryGain.gain.value = 1 - value;
  }

  dispose() {
    this.input.dispose();
    this.output.dispose();
    this.waveShaper.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
  }
}

class NativeLowpassCombFilter {
  input: GainNode;
  output: GainNode;
  private delayNode: DelayNode;
  private filterNode: BiquadFilterNode;
  private feedbackGain: GainNode;

  constructor(
    context: AudioContext,
    delayTime: number,
    resonance: number,
    dampening: number,
  ) {
    this.input = context.createGain();
    this.output = context.createGain();

    this.delayNode = context.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(delayTime, context.currentTime);

    this.filterNode = context.createBiquadFilter();
    this.filterNode.type = "lowpass";
    this.filterNode.frequency.setValueAtTime(dampening, context.currentTime);
    this.filterNode.Q.setValueAtTime(-3.0102999566398125, context.currentTime);

    this.feedbackGain = context.createGain();
    this.feedbackGain.gain.setValueAtTime(resonance, context.currentTime);

    this.input.connect(this.delayNode);
    this.delayNode.connect(this.output);

    this.delayNode.connect(this.filterNode);
    this.filterNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
  }

  set resonance(val: number) {
    this.feedbackGain.gain.setValueAtTime(
      val,
      this.delayNode.context.currentTime,
    );
  }

  set dampening(val: number) {
    this.filterNode.frequency.setValueAtTime(
      val,
      this.delayNode.context.currentTime,
    );
  }

  dispose() {
    this.input.disconnect();
    this.output.disconnect();
    this.delayNode.disconnect();
    this.filterNode.disconnect();
    this.feedbackGain.disconnect();
  }
}

class NativeAllpassFilter {
  input: GainNode;
  output: GainNode;
  private delayNode: DelayNode;
  private feedbackGain: GainNode;
  private feedforwardGain: GainNode;

  constructor(context: AudioContext, delayTime: number, g: number) {
    this.input = context.createGain();
    this.output = context.createGain();

    this.delayNode = context.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(delayTime, context.currentTime);

    this.feedbackGain = context.createGain();
    this.feedbackGain.gain.setValueAtTime(g, context.currentTime);

    this.feedforwardGain = context.createGain();
    this.feedforwardGain.gain.setValueAtTime(-g, context.currentTime);

    this.input.connect(this.delayNode);
    this.input.connect(this.feedforwardGain);
    this.feedforwardGain.connect(this.output);
    this.delayNode.connect(this.output);

    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
  }

  dispose() {
    this.input.disconnect();
    this.output.disconnect();
    this.delayNode.disconnect();
    this.feedbackGain.disconnect();
    this.feedforwardGain.disconnect();
  }
}

export class NativeFreeverb {
  input: ToneType.Gain;
  output: ToneType.Gain;
  private delayNode: DelayNode;
  private combFilters: NativeLowpassCombFilter[];
  private allpassFilters: NativeAllpassFilter[];
  private wetGain: GainNode;
  private dryGain: GainNode;
  private context: AudioContext;

  constructor(
    context: AudioContext,
    roomSize: number,
    preDelay: number,
    Tone: typeof ToneType,
  ) {
    this.context = context;
    this.input = new Tone.Gain();
    this.output = new Tone.Gain();

    this.delayNode = context.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(preDelay, context.currentTime);

    const combTunings = [
      1557 / 44100,
      1617 / 44100,
      1491 / 44100,
      1422 / 44100,
      1277 / 44100,
      1356 / 44100,
      1188 / 44100,
      1116 / 44100,
    ];

    const allpassFrequencies = [225, 556, 441, 341];

    this.wetGain = context.createGain();
    this.dryGain = context.createGain();

    const resonance = roomSize * 0.28 + 0.7;
    const dampening = 3000;

    this.combFilters = combTunings.map((delayTime) => {
      return new NativeLowpassCombFilter(
        context,
        delayTime,
        resonance,
        dampening,
      );
    });

    this.allpassFilters = allpassFrequencies.map((freq) => {
      return new NativeAllpassFilter(context, 1 / freq, 0.5);
    });

    Tone.connect(this.input, this.dryGain);
    Tone.connect(this.dryGain, this.output);
    Tone.connect(this.input, this.delayNode);
    this.delayNode.connect(this.wetGain);

    this.combFilters.forEach((cf) => {
      this.wetGain.connect(cf.input);
    });

    this.combFilters.forEach((cf) => {
      cf.output.connect(this.allpassFilters[0]!.input);
    });

    for (let i = 0; i < this.allpassFilters.length - 1; i++) {
      this.allpassFilters[i]!.output.connect(this.allpassFilters[i + 1]!.input);
    }

    const lastAllpass = this.allpassFilters[this.allpassFilters.length - 1]!;
    Tone.connect(lastAllpass.output, this.output);
  }

  set mix(value: number) {
    this.wetGain.gain.setValueAtTime(value, this.wetGain.context.currentTime);
    this.dryGain.gain.setValueAtTime(
      1 - value,
      this.dryGain.context.currentTime,
    );
  }

  set roomSize(value: number) {
    const resonance = value * 0.28 + 0.7;
    this.combFilters.forEach((cf) => {
      cf.resonance = resonance;
    });
  }

  set preDelay(value: number) {
    this.delayNode.delayTime.setValueAtTime(value, this.context.currentTime);
  }

  dispose() {
    this.input.dispose();
    this.output.dispose();
    this.delayNode.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
    this.combFilters.forEach((cf) => cf.dispose());
    this.allpassFilters.forEach((ap) => ap.dispose());
  }
}

interface NumericValue {
  value: unknown;
}

export interface EffectInstance {
  input?: ToneType.InputNode;
  output?: ToneType.OutputNode;
  dispose: () => unknown;
  wet?: NumericValue;
  mix?: number;
  decay?: number;
  preDelay?: number;
  roomSize?: number;
  delayTime?: NumericValue | number;
  feedback?: NumericValue;
  frequency?: NumericValue | number;
  depth?: NumericValue | number;
  distortion?: number;
  bits?: number;
  order?: number;
  baseFrequency?: NumericValue | number;
  octaves?: NumericValue | number;
  sensitivity?: NumericValue | number;
  _comp?: ToneType.Compressor;
  _inputGain?: ToneType.Gain;
  _outputGain?: ToneType.Gain;
  _wetGain?: GainNode;
  _dryGain?: GainNode;
}

export function asEffectInstance(value: unknown): EffectInstance {
  return value as EffectInstance;
}

export function setNumericValue(
  target: NumericValue | number | undefined,
  value: number,
): boolean {
  if (typeof target === "object" && target !== null) {
    target.value = value;
    return true;
  }
  return false;
}
