"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { Howl } from "howler";
import { notes } from "@/lib/notes";
import { PIANO_CONFIG } from "../../lib/config";

type Voice = {
  noteName: string;
  howl: Howl;
  id: number;
  createdAt: number;
  released: boolean;
  killed?: boolean;
};

export function useNotePlayer(
  volume: number,
  soundType: string,
  sustainMode: boolean,
  maxVoices = PIANO_CONFIG.MAX_POLYPHONY
) {
  const voices = useRef<Voice[]>([]);
  const voicesByNote = useRef<Map<string, Voice[]>>(new Map());
  const heldKeys = useRef<Set<string>>(new Set());
  const pedalActive = useRef(false);

  const FADE_OUT_MS = PIANO_CONFIG.FADE_OUT_MS || 300;
  const KILL_TIMEOUT_MS = FADE_OUT_MS + (PIANO_CONFIG.FADE_OUT_BUFFER_MS || 250);

  // Cache Howl instances by key (folder/fileName)
  const howlCache = useRef<Map<string, Howl>>(new Map());
  const currentSoundType = useRef<string>(soundType);

  const [preloadProgress, setPreloadProgress] = useState<number>(0);
  const [isPreloading, setIsPreloading] = useState<boolean>(false);

  // ----- Cleanup old Howls when soundType changes -----
  useEffect(() => {
    if (currentSoundType.current !== soundType) {
      // Unload all cached Howls from previous soundType
      howlCache.current.forEach((howl) => {
        try {
          howl.unload();
        } catch {}
      });
      howlCache.current.clear();
      currentSoundType.current = soundType;
    }
  }, [soundType]);

  // ----- Preload samples -----
  useEffect(() => {
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
      if (loadedCount >= total) {
        setIsPreloading(false);
      }
    };

    sampleKeys.forEach((key) => {
      // Skip if already cached
      if (howlCache.current.has(key)) {
        onLoaded();
        return;
      }
      
      const [folderPart, fileName] = key.split("/");
      const src = `/samples/${folderPart}/${fileName}.mp3`;
      
      const h = new Howl({
        src: [src],
        preload: true,
        html5: false, // Use Web Audio for lowest latency
        volume: volume,
        onload: onLoaded,
        onloaderror: () => {
          console.warn(`Failed to preload ${src}`);
          onLoaded();
        },
      });
      
      howlCache.current.set(key, h);
    });

    return () => {
      mounted = false;
    };
  }, [soundType, volume]);

  // ----- Voice helpers -----
  const addVoice = useCallback((noteName: string, howl: Howl, id: number) => {
    const v: Voice = { 
      noteName, 
      howl, 
      id, 
      createdAt: Date.now(), 
      released: false 
    };
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

    try { 
      howl.once("end", onEnd, id); 
    } catch { 
      howl.once("end", onEnd); 
    }
  }, []);

  const fadeAndRemoveVoice = useCallback((v: Voice) => {
    if (v.killed) return;
    v.killed = true;
    
    try {
      // Get current volume - can return number or Howl, so we coerce to number
      const currentVol = v.howl.volume(v.id);
      const vol = typeof currentVol === 'number' ? currentVol : volume;
      v.howl.fade(vol, 0, FADE_OUT_MS, v.id); 
    } catch {}
    
    setTimeout(() => {
      try { 
        v.howl.stop(v.id); 
      } catch {}
      voices.current = voices.current.filter((x) => x !== v);
      const arr = (voicesByNote.current.get(v.noteName) || []).filter((x) => x !== v);
      if (arr.length) voicesByNote.current.set(v.noteName, arr);
      else voicesByNote.current.delete(v.noteName);
    }, KILL_TIMEOUT_MS);
  }, [FADE_OUT_MS, KILL_TIMEOUT_MS, volume]);

  const ensurePolyphonyRoom = useCallback(() => {
    while (voices.current.length >= maxVoices) {
      voices.current.sort((a, b) => a.createdAt - b.createdAt);
      const oldest = voices.current.shift();
      if (!oldest) break;
      fadeAndRemoveVoice(oldest);
    }
  }, [maxVoices, fadeAndRemoveVoice]);

  // ----- Pedal (space) handling -----
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
        const toFade = voices.current.filter((v) => v.released && !v.killed);
        toFade.forEach((v) => fadeAndRemoveVoice(v));
      }
    };
    
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [sustainMode, fadeAndRemoveVoice]);

  // ----- playNote -----
  const playNote = useCallback(
    (fileName: string, noteName: string, isKeyboard = false) => {
      if (!fileName || !noteName) return;

      ensurePolyphonyRoom();

      const folder = soundType.toLowerCase();
      const key = `${folder}/${fileName}`;
      let howl = howlCache.current.get(key);

      if (!howl) {
        howl = new Howl({
          src: [`/samples/${folder}/${fileName}.mp3`],
          volume: volume,
          preload: true,
          html5: false
        });
        howlCache.current.set(key, howl);
      }

      // Fade existing voices for this note
      const existing = voicesByNote.current.get(noteName) ?? [];
      existing.forEach((v) => {
        if (!v.killed) fadeAndRemoveVoice(v);
      });

      const id = howl.play();
      if (typeof id === "number") {
        try {
          howl.volume(volume, id);
        } catch {}
      }

      const voiceId = typeof id === "number" ? id : 0;
      addVoice(noteName, howl, voiceId);

      // Track as held if keyboard OR sustainMode is active
      if (isKeyboard || sustainMode) {
        heldKeys.current.add(noteName);
      }
    },
    [addVoice, ensurePolyphonyRoom, fadeAndRemoveVoice, volume, soundType, sustainMode]
  );

  // ----- stopNote -----
  const stopNote = useCallback(
    (noteName: string, isKeyboard = false) => {
      if (!noteName) return;
      if (isKeyboard) heldKeys.current.delete(noteName);

      const arr = voicesByNote.current.get(noteName);
      if (!arr || arr.length === 0) return;

      arr.forEach((v) => {
        if (pedalActive.current || sustainMode) {
          v.released = true; // let the note linger until pedal off
        } else if (!v.killed) {
          v.released = true;
          fadeAndRemoveVoice(v);
        }
      });
    },
    [sustainMode, fadeAndRemoveVoice]
  );


  // ----- API: stopAllNotes -----
  const stopAllNotes = useCallback(() => {
    voices.current.slice().forEach((v) => {
      if (!v.killed) fadeAndRemoveVoice(v);
    });
    voicesByNote.current.clear();
    heldKeys.current.clear();
    pedalActive.current = false;
  }, [fadeAndRemoveVoice]);

  return { playNote, stopNote, stopAllNotes, preloadProgress, isPreloading };
}