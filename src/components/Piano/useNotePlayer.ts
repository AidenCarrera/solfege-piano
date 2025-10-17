"use client";
import { useRef, useCallback, useEffect } from "react";
import { Howl } from "howler";
import { PIANO_CONFIG } from "./config";

/**
 * useNotePlayer Hook
 *
 * Handles polyphonic playback of piano or solfege samples using Howler.js.
 * Notes sustain while held, support pedal (Spacebar), and fade out naturally on release.
 */
export function useNotePlayer(
  volume: number, 
  soundType: string, 
  sustainMode: boolean,
  maxVoices = PIANO_CONFIG.MAX_POLYPHONY
) {
  const activeNotes = useRef<Map<string, Howl>>(new Map());
  const heldKeys = useRef<Set<string>>(new Set());
  const pedalActive = useRef(false); // Renamed for clarity
  const pedalSustainedNotes = useRef<Set<string>>(new Set()); // notes released while pedal is on

  const FADE_OUT_MS = 300;

  /* ----- SPACEBAR Sustain Pedal (only in non-sustain mode) ----- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !sustainMode) {
        e.preventDefault();
        pedalActive.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && !sustainMode) {
        e.preventDefault();
        pedalActive.current = false;

        // Fade out notes that were released while pedal was held
        pedalSustainedNotes.current.forEach(noteName => {
          const sound = activeNotes.current.get(noteName);
          if (sound && sound.playing()) {
            sound.fade(sound.volume(), 0, FADE_OUT_MS);
            setTimeout(() => {
              sound.stop();
              sound.unload();
              activeNotes.current.delete(noteName);
            }, FADE_OUT_MS + 50); // Extra buffer to ensure fade completes
          }
        });
        pedalSustainedNotes.current.clear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [volume, sustainMode]);

  /* ----- PLAY NOTE ----- */
  const playNote = useCallback(
    (fileName: string, noteName: string, isKeyboard = false) => {
      // Prevent runaway polyphony
      if (activeNotes.current.size >= maxVoices) {
        const oldestNote = activeNotes.current.keys().next().value;
        if (typeof oldestNote === "string") {
          const oldestSound = activeNotes.current.get(oldestNote);
          if (oldestSound) {
            oldestSound.stop();
            oldestSound.unload();
            activeNotes.current.delete(oldestNote);
          }
        }
      }

      // If note already playing, fade it out before replaying
      const existingSound = activeNotes.current.get(noteName);
      if (existingSound && existingSound.playing()) {
        existingSound.fade(existingSound.volume(), 0, FADE_OUT_MS);
        setTimeout(() => {
          existingSound.stop();
          existingSound.unload();
          activeNotes.current.delete(noteName);
        }, FADE_OUT_MS + 50);
      }

      const folder = soundType.toLowerCase();
      const sound = new Howl({
        src: [`/samples/${folder}/${fileName}.mp3`],
        volume,
      });

      sound.play();
      activeNotes.current.set(noteName, sound);
      
      // Only track as "held" if it's a keyboard press or if in sustain mode
      if (isKeyboard) {
        heldKeys.current.add(noteName);
      }
    },
    [volume, soundType, maxVoices]
  );

  /* ----- STOP NOTE ----- */
  const stopNote = useCallback(
    (noteName: string, isKeyboard = false) => {
      const sound = activeNotes.current.get(noteName);
      if (!sound) return;

      // Remove from held keys if it was a keyboard release
      if (isKeyboard) {
        heldKeys.current.delete(noteName);
      }

      // In sustain mode, never stop notes automatically
      if (sustainMode) {
        return;
      }

      // If pedal is active (spacebar held), defer fade out until pedal release
      if (pedalActive.current) {
        pedalSustainedNotes.current.add(noteName);
        return;
      }

      // Otherwise, fade out immediately
      if (sound.playing()) {
        sound.fade(sound.volume(), 0, FADE_OUT_MS);
        setTimeout(() => {
          sound.stop();
          sound.unload();
          activeNotes.current.delete(noteName);
        }, FADE_OUT_MS + 50); // Extra buffer to ensure fade completes
      }
    },
    [volume, sustainMode]
  );

  /* ----- STOP ALL NOTES (for when sustain mode is toggled off) ----- */
  const stopAllNotes = useCallback(() => {
    activeNotes.current.forEach((sound) => {
      if (sound.playing()) {
        sound.fade(sound.volume(), 0, FADE_OUT_MS);
        setTimeout(() => {
          sound.stop();
          sound.unload();
        }, FADE_OUT_MS + 50);
      }
    });
    activeNotes.current.clear();
    heldKeys.current.clear();
    pedalSustainedNotes.current.clear();
  }, []);

  return { playNote, stopNote, stopAllNotes };
}