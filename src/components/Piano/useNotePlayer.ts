"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type * as ToneType from "tone";
import { Note } from "@/lib/note";
import { PIANO_CONFIG } from "@/lib/config";
import { EffectNode, ReverbParams, DelayParams, ChorusParams, AutoWahParams } from "@/lib/effects";

function toToneNote(name: string): string {
  return name.replace("s", "#");
}

function createImpulseResponse(context: AudioContext, duration: number, decay: number) {
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

class NativeReverb {
  input: ToneType.Gain;
  output: ToneType.Gain;
  private delayNode: DelayNode;
  private convolver: ConvolverNode;
  private wetGain: GainNode;
  private dryGain: GainNode;
  private context: AudioContext;
  private currentDecay: number;

  constructor(context: AudioContext, decay: number, preDelay: number, Tone: typeof ToneType) {
    this.context = context;
    this.currentDecay = decay;
    
    // Use Tone.Gain for external interoperability
    this.input = new Tone.Gain();
    this.output = new Tone.Gain();
    
    this.delayNode = context.createDelay(1.0);
    this.delayNode.delayTime.value = preDelay;
    
    this.convolver = context.createConvolver();
    this.convolver.buffer = createImpulseResponse(context, decay, 3.0);
    
    this.wetGain = context.createGain();
    this.dryGain = context.createGain();
    
    // Connect input to delayNode, then delayNode to convolver (wet path)
    Tone.connect(this.input, this.delayNode);
    this.delayNode.connect(this.convolver);
    
    // Connect input to dryGain (dry path)
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
      this.convolver.buffer = createImpulseResponse(this.context, value, 3.0);
    }
  }

  set preDelay(value: number) {
    this.delayNode.delayTime.setValueAtTime(value, this.context.currentTime);
  }

  dispose() {
    this.input.disconnect();
    this.output.disconnect();
    this.delayNode.disconnect();
    this.convolver.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
  }
}

interface ActiveEffect {
  id: string;
  type: string;
  input: any;
  output: any;
  instance: any;
}

export function useNotePlayer(
  volume: number,
  effectChain: EffectNode[],
  soundType: string,
  sustainMode: boolean,
  notes: Note[],
  enablePreload: boolean = true
) {
  const [preloadProgress, setPreloadProgress] = useState<number>(0);
  const [isPreloading, setIsPreloading] = useState<boolean>(false);

  const [Tone, setTone] = useState<typeof ToneType | null>(null);
  const [buffers, setBuffers] = useState<ToneType.ToneAudioBuffers | null>(null);
  const [samplerCreated, setSamplerCreated] = useState<boolean>(false);
  const [contextState, setContextState] = useState<string>("suspended");

  const samplerRef = useRef<ToneType.Sampler | null>(null);
  const activeEffectsRef = useRef<Map<string, ActiveEffect>>(new Map());
  
  const heldKeys = useRef<Set<string>>(new Set());
  const activeVoices = useRef<string[]>([]);
  const pedalActive = useRef(false);

  useEffect(() => {
    let mounted = true;
    
    import("tone").then((t) => {
      if (!mounted) return;
      // Configure default context for low latency
      t.getContext().lookAhead = 0.01;
      // Force initialization of Tone.Transport to prevent LFO crashes
      t.getTransport();
      setTone(t);
    });
    
    return () => { 
      mounted = false;
      activeEffectsRef.current.forEach(effect => {
        if (effect.instance && typeof effect.instance.dispose === "function") {
          effect.instance.dispose();
        }
      });
      activeEffectsRef.current.clear();
    };
  }, []);

  // Warm up and start the AudioContext on any user interaction with the page (e.g. click, touch, key press)
  // This runs synchronously inside user events, avoiding browser-enforced AudioContext suspension/blockage.
  useEffect(() => {
    if (!Tone) return;

    const resumeContext = () => {
      if (Tone.getContext().state !== "running") {
        Tone.start();
      }
    };

    window.addEventListener("pointerdown", resumeContext, { capture: true });
    window.addEventListener("keydown", resumeContext, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", resumeContext, { capture: true });
      window.removeEventListener("keydown", resumeContext, { capture: true });
    };
  }, [Tone]);

  // Sync AudioContext state to react state so that effects routing updates automatically when context starts
  useEffect(() => {
    if (!Tone) return;
    const rawCtx = Tone.getContext().rawContext;
    if (rawCtx) {
      setContextState(rawCtx.state);
      const handleStateChange = () => {
        setContextState(rawCtx.state);
      };
      rawCtx.addEventListener("statechange", handleStateChange);
      return () => {
        rawCtx.removeEventListener("statechange", handleStateChange);
      };
    }
  }, [Tone]);

  useEffect(() => {
    if (!enablePreload || !Tone) return;
    let mounted = true;
    const folder = soundType.toLowerCase();

    setIsPreloading(true);
    setPreloadProgress(0);
    setBuffers(null);

    if (samplerRef.current) {
      samplerRef.current.dispose();
      samplerRef.current = null;
      setSamplerCreated(false);
    }

    const urls: Record<string, string> = {};
    notes.forEach((n) => { urls[toToneNote(n.name)] = `${n.fileName}.mp3`; });

    const newBuffers = new Tone.ToneAudioBuffers({
      urls,
      baseUrl: `/samples/${folder}/`,
      onload: () => {
        if (!mounted) return;
        setPreloadProgress(1);
        setIsPreloading(false);
        setBuffers(newBuffers);
      },
      onerror: () => { if (mounted) setIsPreloading(false); }
    });

    return () => {
      mounted = false;
      newBuffers.dispose();
    };
  }, [soundType, notes, enablePreload, Tone]);

  // Eagerly instantiate Sampler once buffers are loaded so that the routing effects are connected immediately
  useEffect(() => {
    if (!Tone || !buffers) {
      if (samplerRef.current) {
        samplerRef.current.dispose();
        samplerRef.current = null;
        setSamplerCreated(false);
      }
      return;
    }

    const bufferMap: Record<string, ToneType.ToneAudioBuffer> = {};
    notes.forEach(n => {
      const toneNote = toToneNote(n.name);
      try {
        if (buffers.has && !buffers.has(toneNote)) return;
        const buf = buffers.get(toneNote);
        if (buf) bufferMap[toneNote] = buf;
      } catch (e) {
        // Ignore missing buffer during transient state
      }
    });

    const sampler = new Tone.Sampler({
      urls: bufferMap as any,
      release: PIANO_CONFIG.FADE_OUT_MS / 1000,
      attack: PIANO_CONFIG.ATTACK_MS / 1000,
    });
    
    sampler.volume.value = Tone.gainToDb(volume * 0.5);
    sampler.connect(Tone.getContext().rawContext.destination);

    samplerRef.current = sampler;
    setSamplerCreated(true);

    return () => {
      if (samplerRef.current) {
        samplerRef.current.dispose();
        samplerRef.current = null;
        setSamplerCreated(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buffers, Tone, notes]);

  // Volume
  useEffect(() => {
    if (samplerRef.current && Tone) {
      samplerRef.current.volume.value = Tone.gainToDb(volume * 0.5);
    }
  }, [volume, Tone]);



  // Dynamic Audio Routing
  useEffect(() => {
    if (!Tone || !samplerRef.current || !samplerCreated) return;
    const nativeContext = Tone.getContext().rawContext as AudioContext;

    // 1. Reconcile existing effects
    const newActiveEffects = new Map<string, ActiveEffect>();
    
    effectChain.forEach((nodeConfig) => {
      let effect = activeEffectsRef.current.get(nodeConfig.id);
      
      if (!effect) {
        // Instantiate new effect
        let instance: any;
        if (nodeConfig.type === "Reverb") {
          const p = nodeConfig.params as ReverbParams;
          instance = new NativeReverb(nativeContext, p.decay, p.preDelay, Tone);
          instance.mix = p.mix;
        } else if (nodeConfig.type === "Delay") {
          const p = nodeConfig.params as DelayParams;
          instance = new Tone.FeedbackDelay({ delayTime: p.delayTime, feedback: p.feedback });
          instance.wet.value = p.mix;
        } else if (nodeConfig.type === "Chorus") {
          const p = nodeConfig.params as ChorusParams;
          // LFO-based effects crash if AudioContext isn't running yet
          if (Tone.getContext().state !== "running") {
            return;
          }
          instance = new Tone.Chorus({ frequency: p.frequency, delayTime: 2.5, depth: p.depth }).start();
          instance.wet.value = p.mix;
        } else if (nodeConfig.type === "AutoWah") {
          const p = nodeConfig.params as AutoWahParams;
          instance = new Tone.AutoWah({ baseFrequency: p.baseFrequency, octaves: p.octaves, sensitivity: p.sensitivity });
          instance.wet.value = p.mix;
        }
        
        effect = {
          id: nodeConfig.id,
          type: nodeConfig.type,
          instance,
          input: instance.input || instance, // NativeReverb has .input, Tone nodes are themselves the input
          output: instance.output || instance
        };
      } else {
        // Update parameters
        const { instance } = effect;
        if (nodeConfig.type === "Reverb") {
          const p = nodeConfig.params as ReverbParams;
          instance.mix = p.mix;
          instance.decay = p.decay;
          instance.preDelay = p.preDelay;
        } else if (nodeConfig.type === "Delay") {
          const p = nodeConfig.params as DelayParams;
          instance.wet.value = p.mix;
          instance.delayTime.value = p.delayTime;
          instance.feedback.value = p.feedback;
        } else if (nodeConfig.type === "Chorus") {
          const p = nodeConfig.params as ChorusParams;
          instance.wet.value = p.mix;
          instance.frequency.value = p.frequency;
          instance.depth = p.depth;
        } else if (nodeConfig.type === "AutoWah") {
          const p = nodeConfig.params as AutoWahParams;
          instance.wet.value = p.mix;
          instance.baseFrequency = p.baseFrequency;
          instance.octaves = p.octaves;
          instance.sensitivity = p.sensitivity;
        }
      }
      
      newActiveEffects.set(nodeConfig.id, effect);
    });

    // Destroy removed effects
    activeEffectsRef.current.forEach((effect, id) => {
      if (!newActiveEffects.has(id)) {
        if (effect.instance && typeof effect.instance.dispose === "function") {
          effect.instance.dispose();
        }
      }
    });
    activeEffectsRef.current = newActiveEffects;

    // 2. Re-wire the chain
    samplerRef.current.disconnect();
    // Also disconnect all effect outputs to prevent stale connections
    newActiveEffects.forEach((effect) => {
      if (effect.output && typeof effect.output.disconnect === "function") {
         effect.output.disconnect();
      }
    });

    let currentOutput: any = samplerRef.current;
    
    effectChain.forEach((nodeConfig) => {
      if (nodeConfig.enabled) {
        const effect = newActiveEffects.get(nodeConfig.id);
        if (effect) {
          // Native AudioNodes vs ToneAudioNodes connection semantics
          if (currentOutput.connect) {
            currentOutput.connect(effect.input);
          }
          currentOutput = effect.output;
        }
      }
    });

    // Final connection to destination
    if (currentOutput.connect) {
      currentOutput.connect(nativeContext.destination);
    }

  }, [effectChain, Tone, samplerCreated, contextState]);

  // Keyboard Pedal
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !sustainMode) {
        e.preventDefault();
        pedalActive.current = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && !sustainMode) {
        e.preventDefault();
        pedalActive.current = false;

        if (samplerRef.current) {
          notes.forEach(n => {
            const toneNote = toToneNote(n.name);
            if (!heldKeys.current.has(n.name)) {
              samplerRef.current?.triggerRelease(toneNote);
              activeVoices.current = activeVoices.current.filter(v => v !== toneNote);
            }
          });
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [sustainMode, notes]);

  const playNote = useCallback(
    async (fileName: string, noteName: string, isKeyboard = false) => {
      if (!Tone || !buffers || !buffers.loaded) return;

      if (Tone.getContext().state !== "running") {
        await Tone.start();
      }

      if (!samplerRef.current) {
        const bufferMap: Record<string, ToneType.ToneAudioBuffer> = {};
        notes.forEach(n => {
          const toneNote = toToneNote(n.name);
          try {
            if (buffers.has && !buffers.has(toneNote)) return;
            const buf = buffers.get(toneNote);
            if (buf) bufferMap[toneNote] = buf;
          } catch (e) {
            // Ignore missing buffer during transient state
          }
        });

        samplerRef.current = new Tone.Sampler({
          urls: bufferMap as any,
          release: PIANO_CONFIG.FADE_OUT_MS / 1000,
          attack: PIANO_CONFIG.ATTACK_MS / 1000,
        });
        
        samplerRef.current.volume.value = Tone.gainToDb(volume * 0.5);
        
        // Trigger a fake re-evaluation of effectChain by copying it?
        // Actually, we can just connect it to the destination directly if there are no effects, 
        // but the routing useEffect will handle it automatically!
        // To be safe and avoid silence before the useEffect runs, we connect to destination initially.
        samplerRef.current.connect(Tone.getContext().rawContext.destination);
        setSamplerCreated(true);
      }

      if (isKeyboard || sustainMode) {
        heldKeys.current.add(noteName);
      }

      const toneNote = toToneNote(noteName);
      
      samplerRef.current.triggerRelease(toneNote, Tone.now());
      activeVoices.current = activeVoices.current.filter(v => v !== toneNote);
      
      activeVoices.current.push(toneNote);
      if (activeVoices.current.length > PIANO_CONFIG.MAX_POLYPHONY) {
        const oldestNote = activeVoices.current.shift();
        if (oldestNote) {
          samplerRef.current.triggerRelease(oldestNote, Tone.now());
          activeVoices.current = activeVoices.current.filter(v => v !== oldestNote);
        }
      }

      samplerRef.current.triggerAttack(toneNote, Tone.now());
    },
    [sustainMode, Tone, buffers, volume, notes]
  );

  const stopNote = useCallback(
    (noteName: string, isKeyboard = false) => {
      if (isKeyboard) heldKeys.current.delete(noteName);

      if (pedalActive.current || sustainMode) {
        return;
      }

      const toneNote = toToneNote(noteName);
      if (samplerRef.current && Tone) {
        samplerRef.current.triggerRelease(toneNote, Tone.now());
        activeVoices.current = activeVoices.current.filter(v => v !== toneNote);
      }
    },
    [sustainMode, Tone]
  );

  const stopAllNotes = useCallback(() => {
    if (samplerRef.current && Tone) {
      samplerRef.current.releaseAll(Tone.now());
    }
    heldKeys.current.clear();
    pedalActive.current = false;
  }, [Tone]);

  return { playNote, stopNote, stopAllNotes, preloadProgress, isPreloading };
}