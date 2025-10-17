"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { notes, type Note } from "@/lib/notes";
import PianoKey from "./PianoKey";
import PianoControls from "./PianoControls";
import { useNotePlayer } from "./useNotePlayer";
import { useKeyboardControls } from "./useKeyboardControls";
import { PIANO_CONFIG } from "./config";

/**
 * Piano Component
 *
 * Provides an interactive piano keyboard with configurable controls.
 * Supports both mouse and keyboard input with adjustable volume,
 * scale, background color, and sound type (Piano or Solfege).
 */
export default function Piano() {
  /* ----- STATE ----- */
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [volume, setVolume] = useState(PIANO_CONFIG.DEFAULT_VOLUME);
  const [labelsEnabled, setLabelsEnabled] = useState(PIANO_CONFIG.DEFAULT_LABELS_ENABLED);
  const [pianoScale, setPianoScale] = useState(PIANO_CONFIG.DEFAULT_PIANO_SCALE);
  const [soundType, setSoundType] = useState<"Piano" | "Solfege">("Piano");
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [sustainActive, setSustainActive] = useState(false);

  // Initialize background color from actual CSS variable
  const [bgColor, setBgColor] = useState(() => {
    if (typeof window !== "undefined") {
      const initial = getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim();
      return initial || "#1d1522"; // fallback to dark purple
    }
    return "#1d1522"; // fallback for SSR
  });

  /* ----- AUDIO + INPUT HOOKS ----- */
  const { playNote, stopNote, stopAllNotes } = useNotePlayer(volume, soundType, sustainActive);

  // Handle keyboard-based note triggering
  useKeyboardControls(
    (fileName, note) => {
      playNote(fileName, note, true); // true = keyboard input
      setActiveNote(note);
      setTimeout(() => setActiveNote(null), PIANO_CONFIG.NOTE_ACTIVE_DURATION_MS);
    },
    (note) => {
      stopNote(note, true); // true = keyboard input
    }
  );

  /* ----- SPACEBAR Sustain Toggle ----- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSustainActive((prev) => {
          const newState = !prev;
          // If turning sustain OFF, stop all notes
          if (!newState) {
            stopAllNotes();
          }
          return newState;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stopAllNotes]);

  /* ----- NOTE MAPPING + POSITIONING ----- */
  const whiteNotes = useMemo(() => notes.filter((n) => !n.isSharp), []);

  const getSharpKeyPosition = (note: Note) => {
    const base = note.name[0];
    const whiteIndex = whiteNotes.findIndex((n) => n.name.startsWith(base));
    return (
      whiteIndex * PIANO_CONFIG.WHITE_KEY_WIDTH_REM +
      PIANO_CONFIG.WHITE_KEY_WIDTH_REM
    );
  };

  /* ----- EVENT HANDLERS ----- */
  const handleMouseDown = useCallback(
    (file: string, name: string) => {
      setIsMouseDown(true);
      playNote(file, name, false); // false = mouse input
      setActiveNote(name);
      setTimeout(() => setActiveNote(null), PIANO_CONFIG.NOTE_ACTIVE_DURATION_MS);
    },
    [playNote]
  );

  const handleMouseEnter = useCallback(
    (file: string, name: string) => {
      if (isMouseDown) handleMouseDown(file, name);
    },
    [isMouseDown, handleMouseDown]
  );

  const handleMouseUp = useCallback(
    (name: string) => {
      stopNote(name, false); // false = mouse input
      setIsMouseDown(false);
    },
    [stopNote]
  );

  /* ----- BACKGROUND + CLEANUP ----- */
  useEffect(() => {
    document.documentElement.style.setProperty("--background", bgColor);
  }, [bgColor]);

  useEffect(() => {
    const handleMouseUp = () => setIsMouseDown(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  /* ----- RENDER ----- */
  return (
    <main className="flex flex-col items-center justify-center min-h-screen select-none">
      <h1 className="text-3xl font-semibold mb-6 text-foreground">
        🎹 Playable Piano
      </h1>

      {/* ----- UI Controls ----- */}
      <PianoControls
        volume={volume}
        setVolume={setVolume}
        labelsEnabled={labelsEnabled}
        setLabelsEnabled={setLabelsEnabled}
        pianoScale={pianoScale}
        setPianoScale={setPianoScale}
        bgColor={bgColor}
        setBgColor={setBgColor}
        soundType={soundType}
        setSoundType={setSoundType}
      />

      {/* ----- Piano Keybed + Sustain Indicator ----- */}
      <div
        className="relative flex flex-col items-center"
        style={{
          transform: `scale(${pianoScale})`,
          transformOrigin: "top center",
          marginBottom: `${(pianoScale - 1) * 200}px`,
        }}
      >
        {/* Piano Keys */}
        <div className="relative flex">
          {notes.map((note) => (
            <PianoKey
              key={note.name}
              note={note}
              activeNote={activeNote}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
              onMouseUp={handleMouseUp}
              getSharpKeyPosition={getSharpKeyPosition}
              showLabel={labelsEnabled}
            />
          ))}
        </div>

        {/* Sustain Indicator (positioned relative to scaled piano) */}
        <div className="flex flex-col items-center mt-6">
          <div
            className={`h-5 w-20 rounded-full transition-all duration-200 ${
              sustainActive
                ? "bg-green-500 shadow-lg shadow-green-700/40"
                : "bg-gray-600"
            }`}
          />
          <p className="text-sm font-medium mt-2 text-foreground text-center">
            Sustain Mode {sustainActive ? "(Active)" : "(Off)"} — Press{" "}
            Spacebar to toggle
          </p>
          <p className="text-sm font-medium mb-1 mt-2 text-foreground">
            Click, drag, or use your keyboard to play notes (C4–C5)
          </p>
        </div>
      </div>
    </main>
  );
}