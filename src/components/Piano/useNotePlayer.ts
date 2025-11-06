"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Howl } from "howler";
import { Note } from "@/lib/note";
import { PIANO_CONFIG } from "@/lib/config";

type Voice = {
  noteName: string;
  howl: Howl;
  id: number;
  createdAt: number;
  released: boolean;
  killed?: boolean;
};

/**
 * useNotePlayer Hook
 * 
 * Manages audio playback for piano notes with polyphony, sustain, and deferred preloading.
 * Handles volume, sound type changes, note release/fade, and keyboard sustain.
 *
 * @param volume - Master volume (0-1)
 * @param soundType - Current sound type ("Piano", "Solfege", etc.)
 * @param sustainMode - Whether sustain mode is active
 * @param notes - Array of Note objects to preload (only visible notes)
 * @param enablePreload - Whether to start preloading (deferred to avoid blocking initial render)
 * @param maxVoices - Maximum polyphony limit
 */
export function useNotePlayer(
  volume: number,
  soundType: string,
  sustainMode: boolean,
  notes: Note[],
  enablePreload: boolean = true,
  maxVoices = PIANO_CONFIG.MAX_POLYPHONY
) {
  /** Active voices and mappings */
  const voices = useRef<Voice[]>([]);
  const voicesByNote = useRef<Map<string, Voice[]>>(new Map());
  const heldKeys = useRef<Set<string>>(new Set());
  const pedalActive = useRef(false);

  /** Fade durations and cleanup timeouts */
  const FADE_OUT_MS = PIANO_CONFIG.FADE_OUT_MS || 300;
  const KILL_TIMEOUT_MS = FADE_OUT_MS + (PIANO_CONFIG.FADE_OUT_BUFFER_MS || 250);

  /** Howl instance cache for efficient playback */
  const howlCache = useRef<Map<string, Howl>>(new Map());
  const currentSoundType = useRef<string>(soundType);

  /** Preloading state */
  const [preloadProgress, setPreloadProgress] = useState<number>(0);
  const [isPreloading, setIsPreloading] = useState<boolean>(false);

  // ----- SOUND TYPE CHANGE HANDLING -----
  useEffect(() => {
    if (currentSoundType.current !== soundType) {
      // Unload all Howls from previous soundType
      howlCache.current.forEach((howl) => {
        try { howl.unload(); } catch {}
      });
      howlCache.current.clear();
      currentSoundType.current = soundType;
    }
  }, [soundType]);

  // ----- DEFERRED SAMPLE PRELOADING -----
  useEffect(() => {
    if (!enablePreload) return;

    let mounted = true;
    const folder = soundType.toLowerCase();
    const sampleKeys = notes.map((n) => `${folder}/${n.fileName}`);
    const total = sampleKeys.length;

    if (total === 0) {
      setPreloadProgress(1);
      setIsPreloading(false);
      return;
    }

    setIsPreloading(true);
    setPreloadProgress(0);
    let loadedCount = 0;

    const onLoaded = () => {
      loadedCount += 1;
      if (!mounted) return;
      setPreloadProgress(loadedCount / total);
      if (loadedCount >= total) setIsPreloading(false);
    };

    sampleKeys.forEach((key) => {
      if (howlCache.current.has(key)) {
        onLoaded();
        return;
      }

      const [folderPart, fileName] = key.split("/");
      const src = `/samples/${folderPart}/${fileName}.mp3`;
      const h = new Howl({
        src: [src],
        preload: true,
        html5: false,
        volume: volume,
        onload: onLoaded,
        onloaderror: () => onLoaded(),
      });

      howlCache.current.set(key, h);
    });

    return () => { mounted = false; };
  }, [soundType, notes, enablePreload, volume]);

  // ----- INTERNAL HELPERS -----

  /** Adds a new voice to tracking structures and sets cleanup on end */
  const addVoice = useCallback((noteName: string, howl: Howl, id: number) => {
    const v: Voice = { noteName, howl, id, createdAt: Date.now(), released: false };
    voices.current.push(v);

    const arr = voicesByNote.current.get(noteName) ?? [];
    arr.push(v);
    voicesByNote.current.set(noteName, arr);

    const onEnd = () => {
      v.killed = true;
      voices.current = voices.current.filter((x) => x !== v);
      const arr2 = (voicesByNote.current.get(noteName) || []).filter((x) => x !== v);
      if (arr2.length) voicesByNote.current.set(noteName, arr2);
      else voicesByNote.current.delete(noteName);
      try { howl.off("end", onEnd, id); } catch {}
    };

    try { howl.once("end", onEnd, id); } catch { howl.once("end", onEnd); }
  }, []);

  /** Fade and remove a voice with proper cleanup */
  const fadeAndRemoveVoice = useCallback((v: Voice) => {
    if (v.killed) return;
    v.killed = true;

    try {
      const currentVol = v.howl.volume(v.id);
      const vol = typeof currentVol === "number" ? currentVol : volume;
      v.howl.fade(vol, 0, FADE_OUT_MS, v.id);
    } catch {}

    setTimeout(() => {
      try { v.howl.stop(v.id); } catch {}
      voices.current = voices.current.filter((x) => x !== v);
      const arr = (voicesByNote.current.get(v.noteName) || []).filter((x) => x !== v);
      if (arr.length) voicesByNote.current.set(v.noteName, arr);
      else voicesByNote.current.delete(v.noteName);
    }, KILL_TIMEOUT_MS);
  }, [FADE_OUT_MS, KILL_TIMEOUT_MS, volume]);

  /** Ensure polyphony limit is respected */
  const ensurePolyphonyRoom = useCallback(() => {
    while (voices.current.length >= maxVoices) {
      voices.current.sort((a, b) => a.createdAt - b.createdAt);
      const oldest = voices.current.shift();
      if (!oldest) break;
      fadeAndRemoveVoice(oldest);
    }
  }, [maxVoices, fadeAndRemoveVoice]);

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
        voices.current.filter((v) => v.released && !v.killed)
                      .forEach(fadeAndRemoveVoice);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [sustainMode, fadeAndRemoveVoice]);

  // ----- PUBLIC API FUNCTIONS -----

  /** 
   * API: Play a note with polyphony handling
   * @param fileName - File name of the sample
   * @param noteName - Note identifier
   * @param isKeyboard - Whether triggered by keyboard
   */
  const playNote = useCallback(
    (fileName: string, noteName: string, isKeyboard = false) => {
      if (!fileName || !noteName) return;

      ensurePolyphonyRoom();

      const folder = soundType.toLowerCase();
      const key = `${folder}/${fileName}`;
      let howl = howlCache.current.get(key);

      if (!howl) {
        howl = new Howl({ src: [`/samples/${folder}/${fileName}.mp3`], volume, preload: true, html5: false });
        howlCache.current.set(key, howl);
      }

      const existing = voicesByNote.current.get(noteName) ?? [];
      existing.forEach((v) => { if (!v.killed) fadeAndRemoveVoice(v); });

      const id = howl.play();
      if (typeof id === "number") try { howl.volume(volume, id); } catch {}
      addVoice(noteName, howl, typeof id === "number" ? id : 0);

      if (isKeyboard || sustainMode) heldKeys.current.add(noteName);
    },
    [addVoice, ensurePolyphonyRoom, fadeAndRemoveVoice, volume, soundType, sustainMode]
  );

  /** 
   * API: Stop a note
   * @param noteName - Note identifier
   * @param isKeyboard - Whether triggered by keyboard
   */
  const stopNote = useCallback(
    (noteName: string, isKeyboard = false) => {
      if (!noteName) return;
      if (isKeyboard) heldKeys.current.delete(noteName);

      const arr = voicesByNote.current.get(noteName);
      if (!arr || arr.length === 0) return;

      arr.forEach((v) => {
        if (pedalActive.current || sustainMode) v.released = true;
        else if (!v.killed) { v.released = true; fadeAndRemoveVoice(v); }
      });
    },
    [sustainMode, fadeAndRemoveVoice]
  );

  /** 
   * API: Stop all currently playing notes immediately
   */
  const stopAllNotes = useCallback(() => {
    voices.current.slice().forEach((v) => { if (!v.killed) fadeAndRemoveVoice(v); });
    voicesByNote.current.clear();
    heldKeys.current.clear();
    pedalActive.current = false;
  }, [fadeAndRemoveVoice]);

  return { playNote, stopNote, stopAllNotes, preloadProgress, isPreloading };
}