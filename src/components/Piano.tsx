"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Howl } from "howler";
import { notes, type Note } from "@/lib/notes";
import PianoKey from "./PianoKey";

// ----- CONFIGURATION -----
const DEFAULT_CONFIG = {
  WHITE_KEY_WIDTH_REM: 4,
  NOTE_COOLDOWN_MS: 50,
  NOTE_ACTIVE_DURATION_MS: 150,
  DEFAULT_VOLUME: 0.2,
  DEFAULT_LABELS_ENABLED: true,
  DEFAULT_PIANO_SCALE: 1.5,
};

const SOUND_OPTIONS = ["Piano", "Solfege"] as const;
type SoundType = (typeof SOUND_OPTIONS)[number];

export default function Piano() {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [volume, setVolume] = useState<number>(DEFAULT_CONFIG.DEFAULT_VOLUME);
  const [labelsEnabled, setLabelsEnabled] = useState<boolean>(
    DEFAULT_CONFIG.DEFAULT_LABELS_ENABLED
  );
  const [pianoScale, setPianoScale] = useState<number>(
    DEFAULT_CONFIG.DEFAULT_PIANO_SCALE
  );
  const [bgColor, setBgColor] = useState<string>("var(--background)");
  const [soundType, setSoundType] = useState<SoundType>("Piano");

  const pressedKeys = useRef<Set<string>>(new Set());
  const lastPlayedTimes = useRef<Record<string, number>>({});
  const currentSoundRef = useRef<Howl | null>(null);
  const currentSoundIdRef = useRef<number | null>(null);

  const CROSSFADE_MS = 10;
  const whiteNotes = useMemo(() => notes.filter((n) => !n.isSharp), []);

  const playNote = useCallback(
    (fileName: string, noteName: string) => {
      const now = Date.now();
      const lastTime = lastPlayedTimes.current[noteName] ?? 0;
      if (now - lastTime < DEFAULT_CONFIG.NOTE_COOLDOWN_MS) return;

      const folder = soundType.toLowerCase();

      const startNew = () => {
        const sound = new Howl({
          src: [`/samples/${folder}/${fileName}.mp3`],
          volume,
        });

        const id = sound.play();

        // Fade in
        sound.volume(0.001, id);
        sound.fade(0.001, Math.max(0.001, volume), Math.max(10, CROSSFADE_MS), id);

        currentSoundRef.current = sound;
        currentSoundIdRef.current = id;
      };

      // If Solfege, crossfade between notes
      if (soundType === "Solfege" && currentSoundRef.current) {
        const oldSound = currentSoundRef.current;
        const oldId = currentSoundIdRef.current ?? null;

        let fromVol = volume;
        const currentVol = oldId !== null ? oldSound.volume(oldId) : undefined;
        if (typeof currentVol === "number") fromVol = currentVol;

        if (oldId !== null) {
          oldSound.fade(fromVol, 0, Math.max(20, CROSSFADE_MS), oldId);
        }

        // After fade, stop and unload
        window.setTimeout(() => {
          if (oldId !== null) {
            oldSound.stop(oldId);
          }
          oldSound.unload?.();

          if (currentSoundRef.current === oldSound) {
            currentSoundRef.current = null;
            currentSoundIdRef.current = null;
          }

          startNew();
        }, Math.max(30, CROSSFADE_MS + 2));
      } else {
        startNew();
      }

      lastPlayedTimes.current[noteName] = now;
      setActiveNote(noteName);
      setTimeout(
        () => setActiveNote((a) => (a === noteName ? null : a)),
        DEFAULT_CONFIG.NOTE_ACTIVE_DURATION_MS
      );
    },
    [volume, soundType]
  );

  // ----- KEYBOARD HANDLERS -----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const note = notes.find((n) => n.key === key);
      if (!note) return;

      e.preventDefault();
      if (!pressedKeys.current.has(key)) {
        pressedKeys.current.add(key);
        playNote(note.fileName, note.name);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      pressedKeys.current.delete(key);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [playNote]);

  // ----- MOUSE HANDLERS -----
  const handleMouseDown = useCallback(
    (fileName: string, noteName: string) => {
      setIsMouseDown(true);
      playNote(fileName, noteName);
    },
    [playNote]
  );

  const handleMouseEnter = useCallback(
    (fileName: string, noteName: string) => {
      if (isMouseDown) playNote(fileName, noteName);
    },
    [isMouseDown, playNote]
  );

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsMouseDown(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  const getSharpKeyPosition = (note: Note) => {
    const base = note.name[0];
    const whiteIndex = whiteNotes.findIndex((n) => n.name.startsWith(base));
    return (
      whiteIndex * DEFAULT_CONFIG.WHITE_KEY_WIDTH_REM +
      DEFAULT_CONFIG.WHITE_KEY_WIDTH_REM
    );
  };

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen select-none"
      style={{ background: bgColor }}
    >
      <h1
        className="text-3xl font-semibold mb-6"
        style={{ color: "var(--foreground)" }}
      >
        🎹 Playable Piano
      </h1>

      {/* Controls */}
      <div
        className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8 items-center justify-center"
        style={{ color: "var(--foreground)" }}
      >
        {/* Volume */}
        <div className="flex flex-col">
          <label className="text-sm mb-1">Volume: {volume.toFixed(2)}</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-40"
          />
        </div>

        {/* Labels */}
        <div className="flex flex-col">
          <label className="text-sm mb-1">
            <input
              type="checkbox"
              checked={labelsEnabled}
              onChange={(e) => setLabelsEnabled(e.target.checked)}
              className="mr-2"
            />
            Labels Enabled
          </label>
        </div>

        {/* Scale */}
        <div className="flex flex-col">
          <label className="text-sm mb-1">
            Piano Scale: {pianoScale.toFixed(2)}
          </label>
          <input
            type="range"
            min={0.5}
            max={2.0}
            step={0.01}
            value={pianoScale}
            onChange={(e) => setPianoScale(parseFloat(e.target.value))}
            className="w-40"
          />
        </div>

        {/* Background */}
        <div className="flex flex-col">
          <label className="text-sm mb-1">Background Color:</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-16 h-8 p-0 border-0"
          />
        </div>

        {/* Sound Type */}
        <div className="flex flex-col">
          <label className="text-sm mb-1">Sound Type:</label>
          <select
            value={soundType}
            onChange={(e) => setSoundType(e.target.value as SoundType)}
            className="px-2 py-1 border rounded-md bg-transparent"
          >
            {SOUND_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Piano Keys */}
      <div
        className="relative flex"
        style={{
          transform: `scale(${pianoScale})`,
          transformOrigin: "top center",
          marginBottom: `${(pianoScale - 1) * 200}px`,
        }}
      >
        {notes.map((note) => (
          <PianoKey
            key={note.name}
            note={note}
            activeNote={activeNote}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            getSharpKeyPosition={getSharpKeyPosition}
            showLabel={labelsEnabled}
          />
        ))}
      </div>

      <p className="text-sm mt-10" style={{ color: "var(--foreground)" }}>
        Click, drag, or use your keyboard to play notes (C4–C5)
      </p>
    </main>
  );
}
