"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Howl } from "howler";
import { notes, type Note } from "@/lib/notes";
import PianoKey from "./PianoKey";

// ----- CONFIGURATION -----
const CONFIG = {
  WHITE_KEY_WIDTH_REM: 4,
  PIANO_SCALE: 1.5,
  NOTE_COOLDOWN_MS: 50,          // Minimum time between triggering same note
  NOTE_ACTIVE_DURATION_MS: 150,  // How long key stays visually active
  VOLUME: 0.2,                   // Playback volume (0.0 - 1.0)
  LABELS_ENABLED: true,          // Show note labels under keys
};

export default function Piano() {
  // ----- STATE -----
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const pressedKeys = useRef<Set<string>>(new Set());
  const lastPlayedTimes = useRef<Record<string, number>>({});

  // ----- MEMOIZED WHITE NOTES -----
  const whiteNotes = useMemo(() => notes.filter(n => !n.isSharp), []);

  // ----- AUDIO PLAYBACK -----
  const playNote = useCallback((fileName: string, noteName: string) => {
    const now = Date.now();
    const lastTime = lastPlayedTimes.current[noteName] ?? 0;
    if (now - lastTime < CONFIG.NOTE_COOLDOWN_MS) return;

    new Howl({
      src: [`/samples/piano/${fileName}.mp3`],
      volume: CONFIG.VOLUME,
    }).play();

    lastPlayedTimes.current[noteName] = now;
    setActiveNote(noteName);

    setTimeout(() => setActiveNote(a => (a === noteName ? null : a)), CONFIG.NOTE_ACTIVE_DURATION_MS);
  }, []);

  // ----- KEYBOARD HANDLERS -----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const note = notes.find(n => n.key === key);
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
  const handleMouseDown = useCallback((fileName: string, noteName: string) => {
    setIsMouseDown(true);
    playNote(fileName, noteName);
  }, [playNote]);

  const handleMouseEnter = useCallback((fileName: string, noteName: string) => {
    if (isMouseDown) playNote(fileName, noteName);
  }, [isMouseDown, playNote]);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsMouseDown(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // ----- SHARP KEY POSITIONING -----
  const getSharpKeyPosition = (note: Note) => {
    const base = note.name[0];
    const whiteIndex = whiteNotes.findIndex(n => n.name.startsWith(base));
    return whiteIndex * CONFIG.WHITE_KEY_WIDTH_REM + CONFIG.WHITE_KEY_WIDTH_REM;
  };

  // ----- RENDER -----
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 select-none">
      <h1 className="text-white text-3xl font-semibold mb-8">🎹 Playable Piano</h1>

      <div
        className="relative flex"
        style={{
          transform: `scale(${CONFIG.PIANO_SCALE})`,
          transformOrigin: "top center",
          marginBottom: `${(CONFIG.PIANO_SCALE - 1) * 200}px`,
        }}
      >
        {notes.map(note => (
          <PianoKey
            key={note.name}
            note={note}
            activeNote={activeNote}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            getSharpKeyPosition={getSharpKeyPosition}
            showLabel={CONFIG.LABELS_ENABLED}
          />
        ))}
      </div>

      <p className="text-gray-400 text-sm mt-10">
        Click, drag, or use your keyboard to play notes (C4–C5)
      </p>
    </main>
  );
}
