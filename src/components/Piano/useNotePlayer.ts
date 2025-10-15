"use client";
import { useRef, useCallback } from "react";
import { Howl } from "howler";
import { PIANO_CONFIG } from "./config";

/**
 * useNotePlayer Hook
 * 
 * Handles playback of piano or solfege audio samples using Howler.js.
 */
export function useNotePlayer(volume: number, soundType: string) {
  /* ----- References to track playback state ----- */
  const lastPlayedTimes = useRef<Record<string, number>>({}); // Prevent rapid retriggering of same note
  const currentSoundRef = useRef<Howl | null>(null);          // Currently playing sound instance
  const currentSoundIdRef = useRef<number | null>(null);      // ID of active Howl sound
  const CROSSFADE_MS = 10;                                    // Fade duration (ms) between Solfege sounds

  /* ----- Play Note Function ----- */
  const playNote = useCallback(
    (fileName: string, noteName: string) => {
      const now = Date.now();
      const lastTime = lastPlayedTimes.current[noteName] ?? 0;

      // Prevents notes from being retriggered too quickly
      if (now - lastTime < PIANO_CONFIG.NOTE_COOLDOWN_MS) return;

      // Choose audio folder based on sound type
      const folder = soundType.toLowerCase();

      /* ----- Start a New Note ----- */
      const startNew = () => {
        const sound = new Howl({
          src: [`/samples/${folder}/${fileName}.mp3`],
          volume,
        });

        const id = sound.play();
        sound.fade(0.001, volume, CROSSFADE_MS, id); // Smooth fade-in for natural attack
        currentSoundRef.current = sound;
        currentSoundIdRef.current = id;
      };

      /* ----- Crossfade Between Solfege Notes ----- */
      if (soundType === "Solfege" && currentSoundRef.current) {
        const old = currentSoundRef.current;
        const oldId = currentSoundIdRef.current;

        // Fade out old sound and replace it after short delay
        if (oldId != null) old.fade(volume, 0, CROSSFADE_MS, oldId);
        setTimeout(() => {
          old.stop();
          old.unload();
          startNew();
        }, CROSSFADE_MS + 10);
      } 
      /* ----- Standard Piano Playback ----- */
      else {
        startNew();
      }

      // Record time of last playback to prevent rapid retriggers
      lastPlayedTimes.current[noteName] = now;
    },
    [volume, soundType]
  );

  /* ----- Return Play Function ----- */
  return playNote;
}
