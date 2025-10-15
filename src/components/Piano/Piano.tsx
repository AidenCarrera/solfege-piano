"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { notes, type Note } from "@/lib/notes";
import PianoKey from "./PianoKey";
import PianoControls from "./PianoControls";
import { useNotePlayer } from "./useNotePlayer";
import { useKeyboardControls } from "./useKeyboardControls";
import { PIANO_CONFIG } from "./config";

export default function Piano() {
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [volume, setVolume] = useState(PIANO_CONFIG.DEFAULT_VOLUME);
  const [labelsEnabled, setLabelsEnabled] = useState(PIANO_CONFIG.DEFAULT_LABELS_ENABLED);
  const [pianoScale, setPianoScale] = useState(PIANO_CONFIG.DEFAULT_PIANO_SCALE);
  const [bgColor, setBgColor] = useState("var(--background)");
  const [soundType, setSoundType] = useState<"Piano" | "Solfege">("Piano");
  const [isMouseDown, setIsMouseDown] = useState(false);

  const playNote = useNotePlayer(volume, soundType);
  useKeyboardControls((file, note) => {
    playNote(file, note);
    setActiveNote(note);
    setTimeout(() => setActiveNote(null), PIANO_CONFIG.NOTE_ACTIVE_DURATION_MS);
  });

  const whiteNotes = useMemo(() => notes.filter((n) => !n.isSharp), []);
  const getSharpKeyPosition = (note: Note) => {
    const base = note.name[0];
    const whiteIndex = whiteNotes.findIndex((n) => n.name.startsWith(base));
    return whiteIndex * PIANO_CONFIG.WHITE_KEY_WIDTH_REM + PIANO_CONFIG.WHITE_KEY_WIDTH_REM;
  };

  const handleMouseDown = useCallback((file: string, name: string) => {
    setIsMouseDown(true);
    playNote(file, name);
    setActiveNote(name);
    setTimeout(() => setActiveNote(null), PIANO_CONFIG.NOTE_ACTIVE_DURATION_MS);
  }, [playNote]);

  const handleMouseEnter = useCallback(
    (file: string, name: string) => {
      if (isMouseDown) handleMouseDown(file, name);
    },
    [isMouseDown, handleMouseDown]
  );

  useEffect(() => {
    const up = () => setIsMouseDown(false);
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen select-none"
      style={{ background: bgColor }}
    >
      <h1 className="text-3xl font-semibold mb-6 text-foreground">🎹 Playable Piano</h1>

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

      <p className="text-sm mt-10 text-foreground">
        Click, drag, or use your keyboard to play notes (C4–C5)
      </p>
    </main>
  );
}
