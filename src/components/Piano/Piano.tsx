"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Note } from "@/lib/note";
import PianoKey from "./PianoKey";
import PianoControls from "./PianoControls";
import { useNotePlayer } from "./useNotePlayer";
import { useKeyboardControls } from "./useKeyboardControls";
import { usePianoScale } from "./usePianoScale";
import { useMouseControls } from "./useMouseControls";
import { useTouchControls } from "./useTouchControls";
import PreloadProgress from "./PreloadProgress";
import { PIANO_CONFIG, SoundType } from "@/lib/config";
import { generateNotes } from "@/lib/noteGenerator";
import { useDeferredPreload } from "./useDeferredPreload";
import { useBackgroundColor } from "./useBackgroundColor";

export default function Piano() {
  /* ----- STATE ----- */
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [volume, setVolume] = useState(PIANO_CONFIG.DEFAULT_VOLUME);
  const [labelsEnabled, setLabelsEnabled] = useState(PIANO_CONFIG.DEFAULT_LABELS_ENABLED);
  const [solfegeEnabled, setSolfegeEnabled] = useState(PIANO_CONFIG.DEFAULT_SOLFEGE_ENABLED);
  const [pianoScale, setPianoScale] = usePianoScale();
  const [bgColor, setBgColor] = useBackgroundColor();
  const [soundType, setSoundType] = useState<SoundType>("Piano");
  const [sustainActive, setSustainActive] = useState(false);
  const [enablePreload, setEnablePreload] = useState(false);

  /* ----- Dynamic Octaves ----- */
  const [startOctave, setStartOctave] = useState(PIANO_CONFIG.DEFAULT_OCTAVE_RANGE[0]);
  const [endOctave, setEndOctave] = useState(PIANO_CONFIG.DEFAULT_OCTAVE_RANGE[1]);

  // Wrapper to handle sound type changes with automatic octave locking
  const handleSoundTypeChange = useCallback((newSoundType: SoundType) => {
    // Lock Solfege to one octave BEFORE changing sound type
    if (newSoundType === "Solfege") {
      setStartOctave(3);
      setEndOctave(4);
    }
    setSoundType(newSoundType);
  }, []);

  // Regenerate notes when octaves change
  const notes: Note[] = useMemo(() => generateNotes(startOctave, endOctave), [startOctave, endOctave]);

  /* ----- Deferred Preload ----- */
  useDeferredPreload(() => setEnablePreload(true), 500);

  /* ----- AUDIO HOOKS ----- */
  const { playNote, stopNote, stopAllNotes, preloadProgress, isPreloading } = useNotePlayer(
    volume,
    soundType,
    sustainActive,
    notes,
    enablePreload
  );

  /* ----- KEYBOARD ----- */
  useKeyboardControls(
    (fileName, note) => {
      playNote(fileName, note, true);
      setActiveNotes((prev) => new Set(prev).add(note));
      setTimeout(() => {
        setActiveNotes((prev) => {
          const copy = new Set(prev);
          copy.delete(note);
          return copy;
        });
      }, PIANO_CONFIG.KEY_HIGHLIGHT_DURATION_MS);
    },
    (note) => {
      stopNote(note, true);
      setActiveNotes((prev) => {
        const copy = new Set(prev);
        copy.delete(note);
        return copy;
      });
    },
    setActiveNotes
  );

  /* ----- MOUSE ----- */
  const { handleMouseDown, handleMouseEnter, handleMouseUp } = useMouseControls(
    playNote,
    stopNote,
    setActiveNotes
  );

  /* ----- TOUCH ----- */
  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchControls(
    playNote,
    stopNote,
    setActiveNotes
  );

  /* ----- SUSTAIN ----- */
  const toggleSustain = useCallback(() => {
    setSustainActive((prev) => {
      const newState = !prev;
      if (!newState) stopAllNotes();
      return newState;
    });
  }, [stopAllNotes]);

  useEffect(() => {
    const handleSpace = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        toggleSustain();
      }
    };
    window.addEventListener("keydown", handleSpace);
    return () => window.removeEventListener("keydown", handleSpace);
  }, [toggleSustain]);

  /* ----- NOTE MAPPING ----- */
  const whiteNotes = useMemo(() => notes.filter((n) => !n.isSharp), [notes]);
  const getSharpKeyPosition = (note: Note) => {
    const match = note.name.match(/^([A-G]s?)(\d+)$/);
    if (!match) return 0;
    const base = match[1].replace("s", "");
    const octave = match[2];
    const whiteIndex = whiteNotes.findIndex((n) => n.name === `${base}${octave}`);
    if (whiteIndex === -1) return 0;
    return whiteIndex * PIANO_CONFIG.WHITE_KEY_WIDTH_REM + PIANO_CONFIG.WHITE_KEY_WIDTH_REM;
  };

  /* ----- BACKGROUND ----- */
  useEffect(() => {
    document.documentElement.style.setProperty("--background", bgColor);
  }, [bgColor]);

  /* ----- RENDER ----- */
  return (
    <main className="flex flex-col items-center justify-center min-h-screen select-none">
      <h1 className="text-3xl font-semibold mb-6 text-foreground">🎹 Playable Piano</h1>

      <PianoControls
        volume={volume}
        setVolume={setVolume}
        labelsEnabled={labelsEnabled}
        setLabelsEnabled={setLabelsEnabled}
        solfegeEnabled={solfegeEnabled}
        setSolfegeEnabled={setSolfegeEnabled}
        pianoScale={pianoScale}
        setPianoScale={setPianoScale}
        bgColor={bgColor}
        setBgColor={setBgColor}
        soundType={soundType}
        setSoundType={handleSoundTypeChange}
        startOctave={startOctave}
        endOctave={endOctave}
        onOctaveChange={(start, end) => {
          setStartOctave(start);
          setEndOctave(end);
        }}
      />

      <div
        className="relative flex flex-col items-center"
        style={{
          transform: `scale(${pianoScale})`,
          transformOrigin: "top center",
          marginBottom: `${(pianoScale - 1) * 200}px`,
        }}
      >
        <PreloadProgress progress={preloadProgress} isPreloading={isPreloading} />

        <div className="relative flex">
          {notes.map((note) => (
            <PianoKey
              key={note.name}
              note={note}
              activeNotes={activeNotes}
              onMouseDown={() => handleMouseDown(note.fileName, note.name)}
              onMouseEnter={() => handleMouseEnter(note.fileName, note.name)}
              onMouseUp={handleMouseUp}
              onTouchStart={(e) => handleTouchStart(e, note.fileName, note.name)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              getSharpKeyPosition={getSharpKeyPosition}
              showLabel={labelsEnabled}
              showSolfege={solfegeEnabled}
            />
          ))}
        </div>

        <div className="flex flex-col items-center mt-6">
          <button
            onClick={toggleSustain}
            className={`h-5 w-20 rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 ${
              sustainActive
                ? "bg-green-500 shadow-lg shadow-green-700/40"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
            aria-label="Toggle sustain mode"
          />
          <p className="text-sm font-medium mt-2 text-foreground text-center">
            Sustain Mode {sustainActive ? "(Active)" : "(Off)"} — Click or press Spacebar
          </p>
          <p className="text-sm font-medium mb-1 mt-2 text-foreground">
            Click, drag, touch, or use your keyboard to play notes
          </p>
        </div>
      </div>
    </main>
  );
}