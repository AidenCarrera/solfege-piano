"use client";
import { useRef, useCallback } from "react";
import { Howl } from "howler";
import { PIANO_CONFIG } from "./config";

export function useNotePlayer(volume: number, soundType: string) {
  const lastPlayedTimes = useRef<Record<string, number>>({});
  const currentSoundRef = useRef<Howl | null>(null);
  const currentSoundIdRef = useRef<number | null>(null);
  const CROSSFADE_MS = 10;

  const playNote = useCallback(
    (fileName: string, noteName: string) => {
      const now = Date.now();
      const lastTime = lastPlayedTimes.current[noteName] ?? 0;
      if (now - lastTime < PIANO_CONFIG.NOTE_COOLDOWN_MS) return;

      const folder = soundType.toLowerCase();

      const startNew = () => {
        const sound = new Howl({
          src: [`/samples/${folder}/${fileName}.mp3`],
          volume,
        });
        const id = sound.play();
        sound.fade(0.001, volume, CROSSFADE_MS, id);
        currentSoundRef.current = sound;
        currentSoundIdRef.current = id;
      };

      if (soundType === "Solfege" && currentSoundRef.current) {
        const old = currentSoundRef.current;
        const oldId = currentSoundIdRef.current;
        if (oldId != null) old.fade(volume, 0, CROSSFADE_MS, oldId);
        setTimeout(() => {
          old.stop();
          old.unload();
          startNew();
        }, CROSSFADE_MS + 10);
      } else {
        startNew();
      }

      lastPlayedTimes.current[noteName] = now;
    },
    [volume, soundType]
  );

  return playNote;
}
