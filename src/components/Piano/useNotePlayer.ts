"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type * as ToneType from "tone";
import { Note } from "@/lib/note";
import { PIANO_CONFIG } from "@/lib/config";

/**
 * Helper to convert our note names (e.g., "Cs4") to standard scientific pitch notation (e.g., "C#4")
 */
function toToneNote(name: string): string {
  return name.replace("s", "#");
}

/**
 * Generates a synthetic impulse response buffer for convolution reverb.
 */
function createImpulseResponse(context: AudioContext, duration: number, decay: number) {
  const sampleRate = context.sampleRate;
  const length = sampleRate * duration;
  const impulse = context.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);
  for (let i = 0; i < length; i++) {
    // Exponential fade
    const fade = Math.pow(1 - i / length, decay);
    left[i] = (Math.random() * 2 - 1) * fade;
    right[i] = (Math.random() * 2 - 1) * fade;
  }
  return impulse;
}

export function useNotePlayer(
  volume: number,
  reverbMix: number,
  soundType: string,
  sustainMode: boolean,
  notes: Note[],
  enablePreload: boolean = true
) {
  const [preloadProgress, setPreloadProgress] = useState<number>(0);
  const [isPreloading, setIsPreloading] = useState<boolean>(false);

  // Dynamically load Tone.js on the client
  const [Tone, setTone] = useState<typeof ToneType | null>(null);
  
  // Track preloaded buffers
  const [buffers, setBuffers] = useState<ToneType.ToneAudioBuffers | null>(null);

  const samplerRef = useRef<ToneType.Sampler | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const wetGainRef = useRef<GainNode | null>(null);
  const heldKeys = useRef<Set<string>>(new Set());
  const activeVoices = useRef<string[]>([]); // Track ringing notes for voice stealing
  const pedalActive = useRef(false);
  const contextStarted = useRef(false);

  // 1. Load Tone.js purely on the client side
  useEffect(() => {
    let mounted = true;
    let localContext: ToneType.Context | null = null;
    
    import("tone").then((t) => {
      if (!mounted) return;
      
      // Initialize a fresh Tone Context to ensure it binds correctly to the browser's AudioContext
      const freshContext = new t.Context({ latencyHint: "interactive", lookAhead: 0.01 });
      t.setContext(freshContext);
      localContext = freshContext;
      
      const nativeContext = freshContext.rawContext as AudioContext;
      
      // Initialize native WebAudio Convolution Reverb
      const convolver = nativeContext.createConvolver();
      convolver.buffer = createImpulseResponse(nativeContext, 2.5, 3.0);
      
      const wetGain = nativeContext.createGain();
      wetGain.gain.value = PIANO_CONFIG.DEFAULT_REVERB_MIX;
      
      convolver.connect(wetGain);
      wetGain.connect(nativeContext.destination);
      
      convolverRef.current = convolver;
      wetGainRef.current = wetGain;
      
      setTone(t);
    });
    
    return () => { 
      mounted = false;
      // Dispose context on unmount to prevent AudioContext exhaustion during development
      if (localContext) {
        localContext.dispose();
      }
      if (convolverRef.current) {
        convolverRef.current.disconnect();
        convolverRef.current = null;
      }
      if (wetGainRef.current) {
        wetGainRef.current.disconnect();
        wetGainRef.current = null;
      }
    };
  }, []);

  // 2. Preload audio buffers (without instantiating the Sampler instrument yet)
  useEffect(() => {
    if (!enablePreload || !Tone) return;

    let mounted = true;
    const folder = soundType.toLowerCase();

    setIsPreloading(true);
    setPreloadProgress(0);

    // Dispose old sampler if sound type changes
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
        setBuffers(newBuffers);
      },
      onerror: () => {
        if (!mounted) return;
        setIsPreloading(false);
      }
    });

    return () => {
      mounted = false;
      // Dispose audio buffers when soundType changes to free memory
      newBuffers.dispose();
    };
  }, [soundType, notes, enablePreload, Tone]);

  // 3. Update volume dynamically
  useEffect(() => {
    if (samplerRef.current && Tone) {
      // Add -6dB of natural headroom to prevent clipping when many notes sum
      samplerRef.current.volume.value = Tone.gainToDb(volume * 0.5);
    }
  }, [volume, Tone]);

  // 4. Update reverb mix dynamically
  useEffect(() => {
    if (wetGainRef.current) {
      wetGainRef.current.gain.value = reverbMix;
    }
  }, [reverbMix]);

  // ----- KEYBOARD PEDAL HANDLING -----
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
              // Remove from active tracking
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

  // ----- PUBLIC API FUNCTIONS -----

  const playNote = useCallback(
    async (fileName: string, noteName: string, isKeyboard = false) => {
      if (!Tone || !buffers || !buffers.loaded) return;

      // Resume AudioContext on first user interaction
      if (!contextStarted.current) {
        if (Tone.getContext().state !== "running") {
          await Tone.start();
        }
        contextStarted.current = true;
      }

      if (!samplerRef.current) {
        // Convert ToneAudioBuffers into a plain object map for the Sampler
        const bufferMap: Record<string, ToneType.ToneAudioBuffer> = {};
        notes.forEach(n => {
          const toneNote = toToneNote(n.name);
          const buf = buffers.get(toneNote);
          if (buf) bufferMap[toneNote] = buf;
        });

        samplerRef.current = new Tone.Sampler({
          urls: bufferMap as any,
          release: PIANO_CONFIG.FADE_OUT_MS / 1000,
          attack: PIANO_CONFIG.ATTACK_MS / 1000,
        });
        
        // Route audio directly to destination (Dry)
        samplerRef.current.connect(Tone.getContext().rawContext.destination);
        
        // Parallel route into the native Convolver (Wet)
        if (convolverRef.current) {
          samplerRef.current.connect(convolverRef.current);
        }
        
        // Apply volume with -6dB headroom
        samplerRef.current.volume.value = Tone.gainToDb(volume * 0.5);
      }

      if (isKeyboard || sustainMode) {
        heldKeys.current.add(noteName);
      }

      const toneNote = toToneNote(noteName);
      
      // Release existing instances of this note to prevent phase stacking
      samplerRef.current.triggerRelease(toneNote, Tone.now());
      activeVoices.current = activeVoices.current.filter(v => v !== toneNote);
      
      // Implement voice stealing to enforce MAX_POLYPHONY limit
      activeVoices.current.push(toneNote);
      if (activeVoices.current.length > PIANO_CONFIG.MAX_POLYPHONY) {
        const oldestNote = activeVoices.current.shift();
        if (oldestNote) {
          samplerRef.current.triggerRelease(oldestNote, Tone.now());
          // Ensure we don't have duplicates of the oldest note floating around
          activeVoices.current = activeVoices.current.filter(v => v !== oldestNote);
        }
      }

      // Trigger attack immediately
      samplerRef.current.triggerAttack(toneNote, Tone.now());
    },
    [sustainMode, Tone, buffers, volume, reverbMix]
  );

  const stopNote = useCallback(
    (noteName: string, isKeyboard = false) => {
      if (isKeyboard) heldKeys.current.delete(noteName);

      if (pedalActive.current || sustainMode) {
        return; // Do not release if pedal is down
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