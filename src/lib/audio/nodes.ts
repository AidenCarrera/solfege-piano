/**
 * Native effects avoid asynchronous rebuilds and AudioWorklet blob URLs,
 * which conflict with live controls and the app's CSP.
 */
import type * as ToneType from "tone";

const IMPULSE_DECAY_EXPONENT = 3.0;

// Coalesce expensive impulse rebuilds while dragging the decay slider.
const IMPULSE_REBUILD_DEBOUNCE_MS = 120;

function createImpulseResponse(
  context: AudioContext,
  duration: number,
  decay: number,
) {
  const sampleRate = context.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * duration));
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

    this.input = new Tone.Gain();
    this.output = new Tone.Gain();

    this.delayNode = context.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(preDelay, context.currentTime);

    this.convolver = context.createConvolver();
    this.convolver.buffer = createImpulseResponse(
      context,
      decay,
      IMPULSE_DECAY_EXPONENT,
    );

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
          IMPULSE_DECAY_EXPONENT,
        );
        this.impulseTimer = null;
      }, IMPULSE_REBUILD_DEBOUNCE_MS);
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

const CRUSHER_CURVE_SIZE = 1024;

function createCrusherCurve(bits: number) {
  const steps = Math.pow(2, bits);
  const curve = new Float32Array(CRUSHER_CURVE_SIZE);
  for (let i = 0; i < CRUSHER_CURVE_SIZE; i++) {
    const x = (i * 2) / CRUSHER_CURVE_SIZE - 1;
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

// Maximally flat Butterworth response: -10·log₁₀(2).
const BUTTERWORTH_Q = -3.0102999566398125;

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
    this.filterNode.Q.setValueAtTime(BUTTERWORTH_Q, context.currentTime);

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

/**
 * Freeverb delay tunings are fixed to their 44.1 kHz reference values.
 * Rescaling them would detune the mutually prime delay network.
 */
const FREEVERB_REFERENCE_SAMPLE_RATE = 44100;
const FREEVERB_COMB_TUNINGS_IN_SAMPLES = [
  1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116,
];
const FREEVERB_ALLPASS_FREQUENCIES = [225, 556, 441, 341];
const FREEVERB_ALLPASS_GAIN = 0.5;

const FREEVERB_DAMPENING_HZ = 3000;

// Stay below unity so the feedback decays.
function roomSizeToResonance(roomSize: number): number {
  return roomSize * 0.28 + 0.7;
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

    this.wetGain = context.createGain();
    this.dryGain = context.createGain();

    const resonance = roomSizeToResonance(roomSize);

    this.combFilters = FREEVERB_COMB_TUNINGS_IN_SAMPLES.map((samples) => {
      return new NativeLowpassCombFilter(
        context,
        samples / FREEVERB_REFERENCE_SAMPLE_RATE,
        resonance,
        FREEVERB_DAMPENING_HZ,
      );
    });

    this.allpassFilters = FREEVERB_ALLPASS_FREQUENCIES.map((freq) => {
      return new NativeAllpassFilter(context, 1 / freq, FREEVERB_ALLPASS_GAIN);
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
    const resonance = roomSizeToResonance(value);
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
