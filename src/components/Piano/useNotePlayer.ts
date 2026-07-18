"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type * as ToneType from "tone";
import { Note } from "@/lib/note";
import { PIANO_CONFIG } from "@/lib/config";
import {
  EffectNode,
  ReverbParams,
  DelayParams,
  ModulationParams,
  DistortionParams,
  FilterParams,
  CompressorParams,
} from "@/lib/effects";
import {
  NativeBitCrusher,
  NativeFreeverb,
  NativeReverb,
  asEffectInstance,
  setNumericValue,
  type EffectInstance,
} from "./audioEffects";

function toToneNote(name: string): string {
  return name.replace("s", "#");
}

interface ActiveEffect {
  id: string;
  type: string;
  mode: string;
  input: ToneType.InputNode;
  output: ToneType.OutputNode;
  instance: EffectInstance;
}

export function useNotePlayer(
  volume: number,
  effectChain: EffectNode[],
  soundType: string,
  sustainMode: boolean,
  notes: Note[],
  enablePreload: boolean = true,
) {
  const [preloadProgress, setPreloadProgress] = useState<number>(0);
  const [isPreloading, setIsPreloading] = useState<boolean>(false);
  const [preloadError, setPreloadError] = useState<string | null>(null);
  const [preloadAttempt, setPreloadAttempt] = useState(0);
  const [engineAttempt, setEngineAttempt] = useState(0);

  const [Tone, setTone] = useState<typeof ToneType | null>(null);
  const [buffers, setBuffers] = useState<ToneType.ToneAudioBuffers | null>(
    null,
  );
  const [contextState, setContextState] =
    useState<AudioContextState>("suspended");

  const samplerRef = useRef<ToneType.Sampler | null>(null);
  const limiterRef = useRef<ToneType.Limiter | null>(null);
  const activeEffectsRef = useRef<Map<string, ActiveEffect>>(new Map());

  const heldKeys = useRef<Set<string>>(new Set());
  const activeVoices = useRef<string[]>([]);
  const pedalActive = useRef(false);

  useEffect(() => {
    if (!enablePreload) return;
    let mounted = true;

    queueMicrotask(() => {
      if (!mounted) return;
      setIsPreloading(true);
      setPreloadProgress(0);
      setPreloadError(null);
    });

    import("tone")
      .then((t) => {
        if (!mounted) return;
        // Reduce latency and initialize Transport before creating LFO effects.
        t.getContext().lookAhead = 0.01;
        t.getTransport();

        const limiter = new t.Limiter(-1);
        limiter.connect(t.getContext().rawContext.destination);
        limiterRef.current = limiter;

        setTone(t);
      })
      .catch(() => {
        if (!mounted) return;
        setIsPreloading(false);
        setPreloadError("The audio engine could not be loaded.");
      });

    return () => {
      mounted = false;
      activeEffectsRef.current.forEach((effect) => {
        if (effect.instance && typeof effect.instance.dispose === "function") {
          effect.instance.dispose();
        }
      });
      activeEffectsRef.current.clear();

      if (limiterRef.current) {
        limiterRef.current.dispose();
        limiterRef.current = null;
      }
    };
  }, [enablePreload, engineAttempt]);

  // Browsers require AudioContext startup within a user gesture.
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
      window.removeEventListener("pointerdown", resumeContext, {
        capture: true,
      });
      window.removeEventListener("keydown", resumeContext, { capture: true });
    };
  }, [Tone]);

  // Reconcile LFO-backed effects after a suspended context starts.
  useEffect(() => {
    if (!Tone) return;
    const rawCtx = Tone.getContext().rawContext;
    if (rawCtx) {
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

    queueMicrotask(() => {
      if (!mounted) return;
      setIsPreloading(true);
      setPreloadProgress(0);
      setPreloadError(null);
      setBuffers(null);
    });

    if (samplerRef.current) {
      samplerRef.current.dispose();
      samplerRef.current = null;
    }

    const urls: Record<string, string> = {};
    notes.forEach((n) => {
      urls[toToneNote(n.name)] = `${n.fileName}.mp3`;
    });

    const newBuffers = new Tone.ToneAudioBuffers({
      urls,
      baseUrl: `/samples/${folder}/`,
      onload: () => {
        if (!mounted) return;
        setPreloadProgress(1);
        setIsPreloading(false);
        setPreloadError(null);
        setBuffers(newBuffers);
      },
      onerror: () => {
        if (!mounted) return;
        setIsPreloading(false);
        setPreloadError("The audio samples could not be loaded.");
      },
    });

    return () => {
      mounted = false;
      newBuffers.dispose();
    };
  }, [soundType, notes, enablePreload, Tone, preloadAttempt]);

  const retryPreload = useCallback(() => {
    setPreloadError(null);
    if (Tone) setPreloadAttempt((attempt) => attempt + 1);
    else setEngineAttempt((attempt) => attempt + 1);
  }, [Tone]);

  // Create the sampler as soon as buffers load so routing is ready before input.
  useEffect(() => {
    if (!Tone || !buffers) {
      if (samplerRef.current) {
        samplerRef.current.dispose();
        samplerRef.current = null;
      }
      return;
    }

    const bufferMap: Record<string, ToneType.ToneAudioBuffer> = {};
    notes.forEach((n) => {
      const toneNote = toToneNote(n.name);
      try {
        if (buffers.has && !buffers.has(toneNote)) return;
        const buf = buffers.get(toneNote);
        if (buf) bufferMap[toneNote] = buf;
      } catch {
        // Buffers can disappear briefly while the sound bank changes.
      }
    });

    const sampler = new Tone.Sampler({
      urls: bufferMap,
      release: PIANO_CONFIG.FADE_OUT_MS / 1000,
      attack: PIANO_CONFIG.ATTACK_MS / 1000,
    });

    sampler.volume.value = Tone.gainToDb(volume);
    if (limiterRef.current) {
      sampler.connect(limiterRef.current);
    } else {
      sampler.connect(Tone.getContext().rawContext.destination);
    }

    samplerRef.current = sampler;

    return () => {
      if (samplerRef.current) {
        samplerRef.current.dispose();
        samplerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buffers, Tone, notes]);

  useEffect(() => {
    if (samplerRef.current && Tone) {
      samplerRef.current.volume.value = Tone.gainToDb(volume) - 3;
    }
  }, [volume, Tone]);

  useEffect(() => {
    if (!Tone || !samplerRef.current || !buffers) return;
    const nativeContext = Tone.getContext().rawContext as AudioContext;

    // Reuse effect instances when possible to preserve their audio state.
    const newActiveEffects = new Map<string, ActiveEffect>();

    effectChain.forEach((nodeConfig) => {
      let effect = activeEffectsRef.current.get(nodeConfig.id);

      // Different modes use different node types and cannot update in place.
      if (effect && effect.mode !== nodeConfig.params.mode) {
        if (effect.instance && typeof effect.instance.dispose === "function") {
          effect.instance.dispose();
        }
        effect = undefined;
      }

      if (!effect) {
        let instance: EffectInstance | undefined;
        if (nodeConfig.type === "Reverb") {
          const p = nodeConfig.params as ReverbParams;
          if (p.mode === "Native") {
            instance = asEffectInstance(
              new NativeReverb(
                nativeContext,
                p.decay ?? 2.5,
                p.preDelay ?? 0.01,
                Tone,
              ),
            );
            instance.mix = p.mix ?? 0.15;
          } else if (p.mode === "Chamber") {
            instance = asEffectInstance(
              new NativeFreeverb(
                nativeContext,
                p.roomSize ?? 0.5,
                p.preDelay ?? 0.01,
                Tone,
              ),
            );
            instance.mix = p.mix ?? 0.15;
          }
        } else if (nodeConfig.type === "Delay") {
          const p = nodeConfig.params as DelayParams;
          if (p.mode === "Feedback") {
            instance = asEffectInstance(
              new Tone.FeedbackDelay({
                delayTime: p.delayTime ?? 0.25,
                feedback: p.feedback ?? 0.4,
              }),
            );
          } else if (p.mode === "PingPong") {
            instance = asEffectInstance(
              new Tone.PingPongDelay({
                delayTime: p.delayTime ?? 0.25,
                feedback: p.feedback ?? 0.4,
              }),
            );
          }
          if (instance) setNumericValue(instance.wet, p.mix ?? 0.2);
        } else if (nodeConfig.type === "Modulation") {
          const p = nodeConfig.params as ModulationParams;
          if (Tone.getContext().state !== "running") return;
          if (p.mode === "Chorus") {
            instance = asEffectInstance(
              new Tone.Chorus({
                frequency: p.frequency ?? 1.5,
                delayTime: 2.5,
                depth: p.depth ?? 0.5,
              }).start(),
            );
          } else if (p.mode === "Vibrato") {
            instance = asEffectInstance(
              new Tone.Vibrato({
                frequency: p.frequency ?? 5.0,
                depth: p.depth ?? 0.1,
              }),
            );
          } else if (p.mode === "Phaser") {
            instance = asEffectInstance(
              new Tone.Phaser({
                frequency: p.frequency ?? 1.5,
                octaves: 2,
                baseFrequency: 350,
                stages: 6,
                Q: 2,
                wet: p.mix ?? 0.5,
              }),
            );
          }
          if (instance) setNumericValue(instance.wet, p.mix ?? 0.5);
        } else if (nodeConfig.type === "Distortion") {
          const p = nodeConfig.params as DistortionParams;
          if (p.mode === "Distortion") {
            instance = asEffectInstance(
              new Tone.Distortion({ distortion: p.amount ?? 0.5 }),
            );
            setNumericValue(instance.wet, p.mix ?? 0.5);
          } else if (p.mode === "BitCrusher") {
            const bits = Math.max(1, Math.round((1 - (p.amount ?? 0.5)) * 8));
            instance = asEffectInstance(
              new NativeBitCrusher(nativeContext, bits, Tone),
            );
            instance.mix = p.mix ?? 0.5;
          } else if (p.mode === "Chebyshev") {
            const order = Math.max(1, Math.round((p.amount ?? 0.5) * 50));
            instance = asEffectInstance(new Tone.Chebyshev({ order }));
            setNumericValue(instance.wet, p.mix ?? 0.5);
          }
        } else if (nodeConfig.type === "Filter") {
          const p = nodeConfig.params as FilterParams;
          if (p.mode === "AutoWah") {
            instance = asEffectInstance(
              new Tone.AutoWah({
                baseFrequency: p.baseFrequency ?? 150,
                octaves: p.octaves ?? 4,
                sensitivity: p.sensitivity ?? -20,
              }),
            );
          } else if (p.mode === "AutoFilter") {
            if (Tone.getContext().state !== "running") return;
            instance = asEffectInstance(
              new Tone.AutoFilter({
                frequency: 2,
                baseFrequency: p.baseFrequency ?? 150,
                octaves: p.octaves ?? 4,
              }).start(),
            );
          }
          if (instance) setNumericValue(instance.wet, p.mix ?? 1.0);
        } else if (nodeConfig.type === "Compressor") {
          const p = nodeConfig.params as CompressorParams;
          const comp = new Tone.Compressor({
            threshold: p.threshold ?? -24,
            ratio: p.ratio ?? 4,
            attack: 0.003,
            release: 0.25,
          });
          // Compressor has no wet control, so provide a parallel dry path.
          const inputGain = new Tone.Gain();
          const outputGain = new Tone.Gain();
          const wetGain = nativeContext.createGain();
          const dryGain = nativeContext.createGain();
          wetGain.gain.value = p.mix ?? 1.0;
          dryGain.gain.value = 1 - (p.mix ?? 1.0);
          Tone.connect(inputGain, comp);
          Tone.connect(comp, wetGain);
          Tone.connect(inputGain, dryGain);
          Tone.connect(wetGain, outputGain);
          Tone.connect(dryGain, outputGain);
          instance = {
            _comp: comp,
            _inputGain: inputGain,
            _outputGain: outputGain,
            _wetGain: wetGain,
            _dryGain: dryGain,
            input: inputGain,
            output: outputGain,
            dispose: () => {
              comp.dispose();
              inputGain.dispose();
              outputGain.dispose();
              wetGain.disconnect();
              dryGain.disconnect();
            },
          };
        }

        if (!instance) return;

        effect = {
          id: nodeConfig.id,
          type: nodeConfig.type,
          mode: nodeConfig.params.mode,
          instance,
          input: instance.input ?? (instance as unknown as ToneType.InputNode),
          output:
            instance.output ?? (instance as unknown as ToneType.OutputNode),
        };
      } else {
        const { instance } = effect;
        if (!instance) return;

        if (nodeConfig.type === "Reverb") {
          const p = nodeConfig.params as ReverbParams;
          if (p.mode === "Native") {
            instance.mix = p.mix ?? 0.15;
            instance.decay = p.decay ?? 2.5;
            instance.preDelay = p.preDelay ?? 0.01;
          } else if (p.mode === "Chamber") {
            instance.mix = p.mix ?? 0.15;
            instance.roomSize = p.roomSize ?? 0.5;
            instance.preDelay = p.preDelay ?? 0.01;
          } else {
            setNumericValue(instance.wet, p.mix ?? 0.15);
          }
        } else if (nodeConfig.type === "Delay") {
          const p = nodeConfig.params as DelayParams;
          setNumericValue(instance.wet, p.mix ?? 0.2);
          setNumericValue(instance.delayTime, p.delayTime ?? 0.25);
          setNumericValue(instance.feedback, p.feedback ?? 0.4);
        } else if (nodeConfig.type === "Modulation") {
          const p = nodeConfig.params as ModulationParams;
          setNumericValue(instance.wet, p.mix ?? 0.5);

          if (!setNumericValue(instance.frequency, p.frequency ?? 1.5)) {
            instance.frequency = p.frequency ?? 1.5;
          }

          if (p.mode !== "Phaser") {
            if (!setNumericValue(instance.depth, p.depth ?? 0.5)) {
              instance.depth = p.depth ?? 0.5;
            }
          }
        } else if (nodeConfig.type === "Distortion") {
          const p = nodeConfig.params as DistortionParams;
          if (p.mode === "Distortion") {
            setNumericValue(instance.wet, p.mix ?? 0.5);
            instance.distortion = p.amount ?? 0.5;
          } else if (p.mode === "BitCrusher") {
            instance.mix = p.mix ?? 0.5;
            instance.bits = Math.max(
              1,
              Math.round((1 - (p.amount ?? 0.5)) * 8),
            );
          } else if (p.mode === "Chebyshev") {
            setNumericValue(instance.wet, p.mix ?? 0.5);
            instance.order = Math.max(1, Math.round((p.amount ?? 0.5) * 50));
          }
        } else if (nodeConfig.type === "Filter") {
          const p = nodeConfig.params as FilterParams;
          setNumericValue(instance.wet, p.mix ?? 1.0);

          if (
            !setNumericValue(instance.baseFrequency, p.baseFrequency ?? 150)
          ) {
            instance.baseFrequency = p.baseFrequency ?? 150;
          }

          if (!setNumericValue(instance.octaves, p.octaves ?? 4)) {
            instance.octaves = p.octaves ?? 4;
          }

          if (p.mode === "AutoWah") {
            if (!setNumericValue(instance.sensitivity, p.sensitivity ?? -20)) {
              instance.sensitivity = p.sensitivity ?? -20;
            }
          }
        } else if (nodeConfig.type === "Compressor") {
          const p = nodeConfig.params as CompressorParams;
          if (instance._comp && instance._wetGain && instance._dryGain) {
            instance._comp.threshold.value = p.threshold ?? -24;
            instance._comp.ratio.value = p.ratio ?? 4;
            instance._wetGain.gain.value = p.mix ?? 1.0;
            instance._dryGain.gain.value = 1 - (p.mix ?? 1.0);
          }
        }
      }

      newActiveEffects.set(nodeConfig.id, effect);
    });

    // Dispose removed nodes before rebuilding graph connections.
    activeEffectsRef.current.forEach((effect, id) => {
      if (!newActiveEffects.has(id)) {
        if (effect.instance && typeof effect.instance.dispose === "function") {
          effect.instance.dispose();
        }
      }
    });
    activeEffectsRef.current = newActiveEffects;

    samplerRef.current.disconnect();
    // Clear stale outgoing edges before reconnecting the ordered chain.
    newActiveEffects.forEach((effect) => {
      if (effect.output && typeof effect.output.disconnect === "function") {
        effect.output.disconnect();
      }
    });

    let currentOutput: ToneType.OutputNode = samplerRef.current;

    effectChain.forEach((nodeConfig) => {
      if (nodeConfig.enabled) {
        const effect = newActiveEffects.get(nodeConfig.id);
        if (effect) {
          // Tone.connect normalizes native and Tone.js node semantics.
          Tone.connect(currentOutput, effect.input);
          currentOutput = effect.output;
        }
      }
    });

    Tone.connect(
      currentOutput,
      limiterRef.current ?? nativeContext.destination,
    );
  }, [effectChain, Tone, buffers, contextState]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !sustainMode) {
        e.preventDefault();
        pedalActive.current = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && !sustainMode && pedalActive.current) {
        e.preventDefault();
        pedalActive.current = false;

        if (samplerRef.current && Tone) {
          notes.forEach((n) => {
            const toneNote = toToneNote(n.name);
            if (!heldKeys.current.has(n.name)) {
              samplerRef.current?.triggerRelease(toneNote, Tone.now());
              activeVoices.current = activeVoices.current.filter(
                (v) => v !== toneNote,
              );
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
  }, [sustainMode, notes, Tone]);

  const playNote = useCallback(
    (fileName: string, noteName: string, isKeyboard = false) => {
      if (!Tone || !buffers || !buffers.loaded) return;

      if (Tone.getContext().state !== "running") {
        Tone.start();
      }

      if (!samplerRef.current) {
        const bufferMap: Record<string, ToneType.ToneAudioBuffer> = {};
        notes.forEach((n) => {
          const toneNote = toToneNote(n.name);
          try {
            if (buffers.has && !buffers.has(toneNote)) return;
            const buf = buffers.get(toneNote);
            if (buf) bufferMap[toneNote] = buf;
          } catch {
            // Buffers can disappear briefly while the sound bank changes.
          }
        });

        samplerRef.current = new Tone.Sampler({
          urls: bufferMap,
          release: PIANO_CONFIG.FADE_OUT_MS / 1000,
          attack: PIANO_CONFIG.ATTACK_MS / 1000,
        });

        samplerRef.current.volume.value = Tone.gainToDb(volume);

        // Provide audio immediately while the routing effect reconciles the chain.
        if (limiterRef.current) {
          samplerRef.current.connect(limiterRef.current);
        } else {
          samplerRef.current.connect(Tone.getContext().rawContext.destination);
        }
      }

      if (isKeyboard || sustainMode) {
        heldKeys.current.add(noteName);
      }

      const toneNote = toToneNote(noteName);

      samplerRef.current.triggerRelease(toneNote, Tone.now());
      activeVoices.current = activeVoices.current.filter((v) => v !== toneNote);

      activeVoices.current.push(toneNote);
      if (activeVoices.current.length > PIANO_CONFIG.MAX_POLYPHONY) {
        const oldestNote = activeVoices.current.shift();
        if (oldestNote) {
          samplerRef.current.triggerRelease(oldestNote, Tone.now());
          activeVoices.current = activeVoices.current.filter(
            (v) => v !== oldestNote,
          );
        }
      }

      samplerRef.current.triggerAttack(toneNote, Tone.now());
    },
    [sustainMode, Tone, buffers, volume, notes],
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
        activeVoices.current = activeVoices.current.filter(
          (v) => v !== toneNote,
        );
      }
    },
    [sustainMode, Tone],
  );

  const stopAllNotes = useCallback(() => {
    if (samplerRef.current && Tone) {
      samplerRef.current.releaseAll(Tone.now());
    }
    heldKeys.current.clear();
    activeVoices.current = [];
    pedalActive.current = false;
  }, [Tone]);

  return {
    playNote,
    stopNote,
    stopAllNotes,
    preloadProgress,
    isPreloading,
    preloadError,
    retryPreload,
  };
}
