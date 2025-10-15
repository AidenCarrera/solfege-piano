"use client";

import { useState, useEffect, useMemo } from "react";
import { Howl } from "howler";
import { notes, type Note } from "@/lib/notes";
import PianoKey from "./PianoKey";

// ----- CONFIGURABLE SCALING -----
const WHITE_KEY_WIDTH_REM = 4;
const PIANO_SCALE = 1.5; // adjust for size
const NOTE_COOLDOWN = 50; // ms between retriggers
const NOTE_ACTIVE_DURATION = 150; // ms key stays visually active

export default function Piano() {
  // ----- STATE -----
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [lastPlayedTimes, setLastPlayedTimes] = useState<Record<string, number>>({});

  // ----- MEMOIZED WHITE KEYS -----
  const whiteNotes = useMemo(() => notes.filter(n => !n.isSharp), []);

  // ----- AUDIO PLAYBACK -----
  const playNote = (fileName: string, noteName: string) => {
    const now = Date.now();
    const lastTime = lastPlayedTimes[noteName] ?? 0;
    if (now - lastTime < NOTE_COOLDOWN) return;

    new Howl({
      src: [`/samples/piano/${fileName}.mp3`],
      volume: 0.2,
    }).play();

    setActiveNote(noteName);
    setLastPlayedTimes(prev => ({ ...prev, [noteName]: now }));

    setTimeout(() => setActiveNote(a => (a === noteName ? null : a)), NOTE_ACTIVE_DURATION);
  };

  // ----- KEYBOARD HANDLERS -----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const note = notes.find(n => n.key === key);
      if (!note) return;

      e.preventDefault();

      setPressedKeys(prev => {
        if (prev.has(key)) return prev; // prevent spam
        const next = new Set(prev).add(key);
        playNote(note.fileName, note.name);
        return next;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []); // ✅ stable event listeners

  // ----- MOUSE HANDLERS -----
  const handleMouseDown = (fileName: string, noteName: string) => {
    setIsMouseDown(true);
    playNote(fileName, noteName);
  };

  const handleMouseEnter = (fileName: string, noteName: string) => {
    if (isMouseDown) playNote(fileName, noteName);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsMouseDown(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // ----- POSITIONING -----
  const getSharpKeyPosition = (note: Note) => {
    const baseNote = note.name[0];
    const whiteIndex = whiteNotes.findIndex(n => n.name.startsWith(baseNote));
    return whiteIndex * WHITE_KEY_WIDTH_REM + WHITE_KEY_WIDTH_REM;
  };

  // ----- RENDER -----
  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 select-none"
    >
      <h1 className="text-white text-3xl font-semibold mb-8">🎹 Playable Piano</h1>

      <div
        className="relative flex"
        style={{
          transform: `scale(${PIANO_SCALE})`,
          transformOrigin: "top center",
          marginBottom: `${(PIANO_SCALE - 1) * 200}px`,
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
          />
        ))}
      </div>

      <p className="text-gray-400 text-sm mt-10">
        Click, drag, or use your keyboard to play notes (C4–C5)
      </p>
    </main>
  );
}
