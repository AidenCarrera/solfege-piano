"use client";
import { useRef, useCallback, useEffect } from "react";
import { Howl } from "howler";
import { PIANO_CONFIG } from "./config";

/**
 * Robust useNotePlayer
 * - Tracks voices (Howl + id) per note (allowing retriggering while old voice decays)
 * - Uses Howler play ids for fades/stops
 * - Handles pedal (space) sustain reliably
 * - Evicts oldest voices when max polyphony reached
 *
 * API: const { playNote, stopNote, stopAllNotes } = useNotePlayer(volume, soundType, sustainMode, maxVoices)
 * playNote(fileName, noteName, isKeyboard)
 * stopNote(noteName, isKeyboard)
 */
type Voice = {
  noteName: string;
  howl: Howl;
  id: number;
  createdAt: number;
  released: boolean; // whether key has been released for this voice
  killed?: boolean; // whether cleanup initiated
};

export function useNotePlayer(
  volume: number,
  soundType: string,
  sustainMode: boolean,
  maxVoices = PIANO_CONFIG.MAX_POLYPHONY
) {
  const voices = useRef<Voice[]>([]); // active voices across all notes (ordered roughly by creation time)
  const voicesByNote = useRef<Map<string, Voice[]>>(new Map()); // quick lookup
  const heldKeys = useRef<Set<string>>(new Set()); // currently held note names (keyboard)
  const pedalActive = useRef(false); // spacebar pedal state (if using pedal when sustainMode === false)
  const FADE_OUT_MS = 300;
  const KILL_TIMEOUT_MS = FADE_OUT_MS + 250;

  /* --- helper: create voice and add bookkeeping --- */
  const addVoice = useCallback((noteName: string, howl: Howl, id: number) => {
    const v: Voice = {
      noteName,
      howl,
      id,
      createdAt: Date.now(),
      released: false,
    };
    voices.current.push(v);
    const arr = voicesByNote.current.get(noteName) ?? [];
    arr.push(v);
    voicesByNote.current.set(noteName, arr);

    // cleanup when sample ends naturally
    const onEnd = () => {
      // remove voice
      v.killed = true;
      // remove from arrays
      voices.current = voices.current.filter((x) => x !== v);
      const arr2 = (voicesByNote.current.get(noteName) || []).filter((x) => x !== v);
      if (arr2.length) voicesByNote.current.set(noteName, arr2);
      else voicesByNote.current.delete(noteName);
      try { howl.off("end", onEnd, id); } catch {}
    };
    try {
      howl.once("end", onEnd, id);
    } catch {
      // Howler variants might not support the id param for once in some versions; we keep the handler general
      howl.once("end", onEnd);
    }
  }, []);

  /* --- helper: fade and remove voice safely --- */
  const fadeAndRemoveVoice = useCallback((v: Voice) => {
    if (v.killed) return;
    v.killed = true;
    try {
      // fade using id
      v.howl.fade(v.howl.volume(), 0, FADE_OUT_MS, v.id);
    } catch {
      // ignore if fade fails
    }
    // schedule cleanup after fade + buffer
    setTimeout(() => {
      try {
        v.howl.stop(v.id);
        v.howl.unload();
      } catch {}
      voices.current = voices.current.filter((x) => x !== v);
      const arr = (voicesByNote.current.get(v.noteName) || []).filter((x) => x !== v);
      if (arr.length) voicesByNote.current.set(v.noteName, arr);
      else voicesByNote.current.delete(v.noteName);
    }, KILL_TIMEOUT_MS);
  }, []);

  /* --- Evict oldest voices until there's room --- */
  const ensurePolyphonyRoom = useCallback(() => {
    while (voices.current.length >= maxVoices) {
      // pick oldest by createdAt
      voices.current.sort((a, b) => a.createdAt - b.createdAt);
      const oldest = voices.current.shift();
      if (!oldest) break;
      fadeAndRemoveVoice(oldest);
    }
  }, [maxVoices, fadeAndRemoveVoice]);

  /* --- Pedal handlers (space) only active when sustainMode === false (your existing design) --- */
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
        // On pedal up: fade voices that were released while pedal was down
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

  /* ----------------- API: playNote -----------------
     fileName, noteName are expected to be defined strings (caller must ensure)
     isKeyboard: true if triggered by keyboard (so we track heldKeys)
  --------------------------------------------------*/
  const playNote = useCallback(
    (fileName: string, noteName: string, isKeyboard = false) => {
      if (!fileName || !noteName) return; // defensive

      // prevent repeated keydown retriggers for the keyboard layer should be handled by keyboard handler (use e.repeat guard).
      // Here we allow retriggers: pressing a key again will re-trigger (we remove old voice for the same note afterwards).
      ensurePolyphonyRoom();

      // If same note currently playing and we want an immediate re-strike, fade the existing instances (but keep them until fade done)
      const existing = voicesByNote.current.get(noteName) ?? [];
      existing.forEach((v) => {
        // fade existing voice a bit (don't immediately delete—use fade helper)
        if (!v.killed) fadeAndRemoveVoice(v);
      });

      const folder = soundType.toLowerCase();
      const howl = new Howl({
        src: [`/samples/${folder}/${fileName}.mp3`],
        volume,
      });

      // play and track id
      const id = howl.play();
      // Some Howler versions return undefined for id synchronously — coerce to number (fallback 0)
      const voiceId = typeof id === "number" ? id : 0;
      addVoice(noteName, howl, voiceId);

      // If triggered by keyboard, mark held
      if (isKeyboard) heldKeys.current.add(noteName);
      // If pedal is active (and not in sustainMode), we treat releases differently later
    },
    [addVoice, ensurePolyphonyRoom, fadeAndRemoveVoice, volume, soundType]
  );

  /* ----------------- API: stopNote -----------------
     When key/mouse releases call stopNote(noteName, isKeyboard)
     If sustainMode is true -> don't stop (instrument plays full sample)
     If pedal active -> mark voice released (fade later on pedal up)
     Otherwise fade immediate for voices belonging to that note that are not already released
  --------------------------------------------------*/
  const stopNote = useCallback(
    (noteName: string, isKeyboard = false) => {
      if (!noteName) return;
      // If keyboard, remove from held
      if (isKeyboard) heldKeys.current.delete(noteName);

      // If sustainMode (global behavior), do nothing on release: samples play full length
      if (sustainMode) return;

      // Find voices for that note
      const arr = voicesByNote.current.get(noteName);
      if (!arr || arr.length === 0) return;

      // For each active voice for that note:
      arr.forEach((v) => {
        // If pedal active (space down when sustainMode false), mark for later
        if (pedalActive.current) {
          v.released = true;
          return;
        }
        // Otherwise fade right now (but only those not already released/killed)
        if (!v.killed) {
          v.released = true;
          fadeAndRemoveVoice(v);
        }
      });
    },
    [sustainMode, fadeAndRemoveVoice]
  );

  /* ----------------- API: stopAll ----------------- */
  const stopAllNotes = useCallback(() => {
    voices.current.slice().forEach((v) => {
      if (!v.killed) fadeAndRemoveVoice(v);
    });
    voicesByNote.current.clear();
    heldKeys.current.clear();
    pedalActive.current = false;
  }, [fadeAndRemoveVoice]);

  return { playNote, stopNote, stopAllNotes };
}
