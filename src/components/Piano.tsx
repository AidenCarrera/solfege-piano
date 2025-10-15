"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Howl } from "howler";
import { notes, type Note } from "@/lib/notes";
import PianoKey from "./PianoKey";

// ----- CONFIGURATION -----
const DEFAULT_CONFIG = {
  WHITE_KEY_WIDTH_REM: 4,
  NOTE_COOLDOWN_MS: 50,          // Minimum time between triggering same note
  NOTE_ACTIVE_DURATION_MS: 150,  // How long key stays visually active
  DEFAULT_VOLUME: 0.2,           // Playback volume (0.0 - 1.0)
  DEFAULT_LABELS_ENABLED: true,  // Show note labels under keys
  DEFAULT_PIANO_SCALE: 1.5,      // Default scale
};

export default function Piano() {
  // ----- STATE -----
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [volume, setVolume] = useState<number>(DEFAULT_CONFIG.DEFAULT_VOLUME);
  const [labelsEnabled, setLabelsEnabled] = useState<boolean>(DEFAULT_CONFIG.DEFAULT_LABELS_ENABLED);
  const [pianoScale, setPianoScale] = useState<number>(DEFAULT_CONFIG.DEFAULT_PIANO_SCALE);
  const [bgColor, setBgColor] = useState<string>("var(--background)");

  const pressedKeys = useRef<Set<string>>(new Set());
  const lastPlayedTimes = useRef<Record<string, number>>({});

  // ----- MEMOIZED WHITE NOTES -----
  const whiteNotes = useMemo(() => notes.filter(n => !n.isSharp), []);

  // ----- AUDIO PLAYBACK -----
  const playNote = useCallback((fileName: string, noteName: string) => {
    const now = Date.now();
    const lastTime = lastPlayedTimes.current[noteName] ?? 0;
    if (now - lastTime < DEFAULT_CONFIG.NOTE_COOLDOWN_MS) return;

    new Howl({
      src: [`/samples/piano/${fileName}.mp3`],
      volume,
    }).play();

    lastPlayedTimes.current[noteName] = now;
    setActiveNote(noteName);

    setTimeout(() => setActiveNote(a => (a === noteName ? null : a)), DEFAULT_CONFIG.NOTE_ACTIVE_DURATION_MS);
  }, [volume]);

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
    return whiteIndex * DEFAULT_CONFIG.WHITE_KEY_WIDTH_REM + DEFAULT_CONFIG.WHITE_KEY_WIDTH_REM;
  };

  // ----- RENDER -----
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

      {/* --- CONTROLS --- */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8 items-center" style={{ color: "var(--foreground)" }}>
        <div className="flex flex-col">
          <label className="text-sm mb-1">Volume: {volume.toFixed(2)}</label>
          <input
            type="range"
            min={0} max={1} step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-40"
          />
        </div>

        {/* Labels Enabled */}
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

        {/* Piano Scale */}
        <div className="flex flex-col">
          <label className="text-sm mb-1">Piano Scale: {pianoScale.toFixed(2)}</label>
          <input
            type="range"
            min={0.5} max={2.0} step={0.01}
            value={pianoScale}
            onChange={(e) => setPianoScale(parseFloat(e.target.value))}
            className="w-40"
          />
        </div>

        {/* Background Color Picker */}
        <div className="flex flex-col">
          <label className="text-sm mb-1">Background Color:</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-16 h-8 p-0 border-0"
          />
        </div>
      </div>

      {/* --- PIANO --- */}
      <div
        className="relative flex"
        style={{
          transform: `scale(${pianoScale})`,
          transformOrigin: "top center",
          marginBottom: `${(pianoScale - 1) * 200}px`,
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
