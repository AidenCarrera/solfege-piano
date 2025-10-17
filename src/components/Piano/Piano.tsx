"use client";

import { useState, useMemo, useEffect } from "react";
import { notes, type Note } from "@/lib/notes";
import PianoKey from "./PianoKey";
import PianoControls from "./PianoControls";
import { useNotePlayer } from "./useNotePlayer";
import { useKeyboardControls } from "./useKeyboardControls";
import { useMouseControls } from "./useMouseControls";
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
  const [pianoScale, setPianoScale] = useState(() => {
    if (typeof window !== "undefined") {
      const width = window.innerWidth;
      if (width < 640) return 0.5; // Mobile (sm breakpoint)
      if (width < 768) return 0.75; // Small tablets (md breakpoint)
      if (width < 1024) return 1.0; // Tablets (lg breakpoint)
      return PIANO_CONFIG.DEFAULT_PIANO_SCALE; // Desktop: 1.5
    }
    return PIANO_CONFIG.DEFAULT_PIANO_SCALE;
  });
  const [soundType, setSoundType] = useState<"Piano" | "Solfege">("Piano");
  const [sustainActive, setSustainActive] = useState(false);

  // Initialize background color from CSS variable
  const [bgColor, setBgColor] = useState(() => {
    if (typeof window !== "undefined") {
      const initial = getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim();
      return initial || "#1d1522";
    }
    return "#1d1522";
  });

  /* ----- AUDIO + INPUT HOOKS ----- */
  const { playNote, stopNote, stopAllNotes, preloadProgress, isPreloading } =
    useNotePlayer(volume, soundType, sustainActive);

  // Keyboard input (play / stop notes)
  useKeyboardControls(
    (fileName, note) => {
      playNote(fileName, note, true);
      setActiveNote(note);
      setTimeout(() => setActiveNote(null), PIANO_CONFIG.NOTE_ACTIVE_DURATION_MS);
    },
    (note) => stopNote(note, true)
  );

  // Mouse input via custom hook
  const { handleMouseDown, handleMouseEnter, handleMouseUp } = useMouseControls(
    playNote,
    stopNote,
    setActiveNote,
    PIANO_CONFIG.NOTE_ACTIVE_DURATION_MS
  );

  /* ----- SUSTAIN TOGGLE HANDLER ----- */
  const toggleSustain = () => {
    setSustainActive((prev) => {
      const newState = !prev;
      if (!newState) stopAllNotes(); // stop all when pedal released
      return newState;
    });
  };

  /* ----- SPACEBAR SUSTAIN TOGGLE ----- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        toggleSustain();
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

  /* ----- BACKGROUND ----- */
  useEffect(() => {
    document.documentElement.style.setProperty("--background", bgColor);
  }, [bgColor]);

  /* ----- RENDER ----- */
  return (
    <main className="flex flex-col items-center justify-center min-h-screen select-none">
      <h1 className="text-3xl font-semibold mb-6 text-foreground">🎹 Playable Piano</h1>

      {/* Controls */}
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

      {/* Piano + Sustain */}
      <div
        className="relative flex flex-col items-center"
        style={{
          transform: `scale(${pianoScale})`,
          transformOrigin: "top center",
          marginBottom: `${(pianoScale - 1) * 200}px`,
        }}
      >
        {/* Preload progress (scales with piano) */}
        {isPreloading && (
          <div className="mb-4 w-full flex justify-center pointer-events-none">
            <div className="w-72 max-w-full bg-[rgba(0,0,0,0.15)] rounded-md p-2 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground/90 mb-1">Loading samples…</div>
                <div className="h-2 w-full bg-foreground/10 rounded overflow-hidden">
                  <div
                    className="h-full bg-foreground rounded"
                    style={{ width: `${Math.round(preloadProgress * 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-xs font-mono text-foreground/80 w-12 text-right">
                {Math.round(preloadProgress * 100)}%
              </div>
            </div>
          </div>
        )}

        {/* Keys */}
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

        {/* Sustain Indicator - Now clickable! */}
        <div className="flex flex-col items-center mt-6">
          <button
            onClick={toggleSustain}
            className={`h-5 w-20 rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
              sustainActive ? "bg-green-500 shadow-lg shadow-green-700/40" : "bg-gray-600 hover:bg-gray-500"
            }`}
            aria-label="Toggle sustain mode"
          />
          <p className="text-sm font-medium mt-2 text-foreground text-center">
            Sustain Mode {sustainActive ? "(Active)" : "(Off)"} — Click or press Spacebar
          </p>
          <p className="text-sm font-medium mb-1 mt-2 text-foreground">
            Click, drag, or use your keyboard to play notes (C4–C5)
          </p>
        </div>
      </div>
    </main>
  );
}