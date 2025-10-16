"use client";
import { useRef, useCallback, useEffect, useState } from "react";
import { Howl } from "howler";
import { PIANO_CONFIG } from "./config";

/**
 * useNotePlayer Hook
 *
 * Handles playback of piano or solfege audio samples using Howler.js.
 * Supports sustain pedal toggling (Spacebar) with robust cleanup to prevent hanging notes.
 */
export function useNotePlayer(volume: number, soundType: string) {
  const lastPlayedTimes = useRef<Record<string, number>>({});
  const activeNotes = useRef<Map<string, Howl>>(new Map());
  const sustainWasActiveRef = useRef(false);
  const [sustainActive, setSustainActive] = useState(false);
  const cleanupLock = useRef(false); // prevents notes being added right after pedal drop
  const CROSSFADE_MS = 10;

  /* ----- SPACEBAR Sustain Toggle ----- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();

        setSustainActive((prev) => {
          const newState = !prev;
          sustainWasActiveRef.current = newState;

          // ----- If turning sustain OFF -----
          if (!newState) {
            cleanupLock.current = true;

            // Fade out all active sustained notes
            activeNotes.current.forEach((sound, noteName) => {
              if (sound.playing()) {
                sound.fade(volume, 0, 400);
                setTimeout(() => {
                  sound.stop();
                  sound.unload();
                  activeNotes.current.delete(noteName);
                }, 400);
              }
            });

            // Small lockout window (prevents notes sneaking in during cleanup)
            setTimeout(() => {
              cleanupLock.current = false;
            }, 150);
          }

          return newState;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [volume]);

  /* ----- Play Note Function ----- */
  const playNote = useCallback(
    (fileName: string, noteName: string) => {
      const now = Date.now();
      const lastTime = lastPlayedTimes.current[noteName] ?? 0;

      if (now - lastTime < PIANO_CONFIG.NOTE_COOLDOWN_MS) return;

      const folder = soundType.toLowerCase();

      const sound = new Howl({
        src: [`/samples/${folder}/${fileName}.mp3`],
        volume,
      });

      const id = sound.play();
      lastPlayedTimes.current[noteName] = now;

      // Sustain logic
      if (sustainWasActiveRef.current && !cleanupLock.current) {
        // Pedal down → keep ringing
        activeNotes.current.set(noteName, sound);
      } else {
        // Pedal off → short, dry note
        setTimeout(() => {
          if (sound.playing()) {
            sound.fade(volume, 0, 200);
            setTimeout(() => {
              sound.stop();
              sound.unload();
            }, 200);
          }
        }, 330);
      }
    },
    [volume, soundType]
  );

  return playNote;
}
