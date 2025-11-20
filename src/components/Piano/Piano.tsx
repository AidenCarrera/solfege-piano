"use client";

import { useState, useMemo, useCallback } from "react";

import { Note } from "@/lib/note";
import { generateNotes } from "@/lib/noteGenerator";
import { PIANO_CONFIG, SoundType } from "@/lib/config";

import { usePianoScale } from "./usePianoScale";
import { useNotePlayer } from "./useNotePlayer";
import { useKeyboardControls } from "./useKeyboardControls";
import { useMouseControls } from "./useMouseControls";
import { useTouchControls } from "./useTouchControls";
import { useDeferredPreload } from "./useDeferredPreload";
import { useBackgroundColor } from "./useBackgroundColor";
import { useSustainToggle } from "./useSustainToggle";
import { useActiveNotes } from "./useActiveNotes";
import { getContrastColor, getShadowColor } from "@/lib/colorUtils";

import PianoKey from "./PianoKey";
import PianoControls from "./PianoControls";
import PreloadProgress from "./PreloadProgress";

export default function Piano() {
  /* ------------------ State ------------------ */
  const { 
    activeNotes, 
    activateNote, 
    deactivateNote, 
    flashNote,
    clearAllNotes,
  } = useActiveNotes();

  const [volume, setVolume] = useState(PIANO_CONFIG.DEFAULT_VOLUME);
  const [labelsEnabled, setLabelsEnabled] = useState(PIANO_CONFIG.DEFAULT_LABELS_ENABLED);
  const [solfegeEnabled, setSolfegeEnabled] = useState(PIANO_CONFIG.DEFAULT_SOLFEGE_ENABLED);
  const [pianoScale, setPianoScale] = usePianoScale();
  const [bgColor, setBgColor] = useBackgroundColor();
  const [soundType, setSoundType] = useState<SoundType>("Piano");
  const [enablePreload, setEnablePreload] = useState(false);

  // Octave range (updates note set when changed)
  const [startOctave, setStartOctave] = useState(PIANO_CONFIG.DEFAULT_OCTAVE_RANGE[0]);
  const [endOctave, setEndOctave] = useState(PIANO_CONFIG.DEFAULT_OCTAVE_RANGE[1]);

  // Handle sound type switching (locks Solfege to one octave)
  const handleSoundTypeChange = useCallback((newSoundType: SoundType) => {
    if (newSoundType === "Solfege") {
      setStartOctave(3);
      setEndOctave(4);
      setPianoScale(1.5); // lock scale to 1.5 in Solfege mode
    }
    setSoundType(newSoundType);
  }, [setPianoScale]);

  // Generate piano notes based on the current octave range
  const notes: Note[] = useMemo(() => generateNotes(startOctave, endOctave), [startOctave, endOctave]);

  /* ------------------ Audio ------------------ */
  // Delays sample preloading slightly after render for smoother UX
  useDeferredPreload(() => setEnablePreload(true), 500);

  const [sustainActive, setSustainActive] = useState(false);

  const { playNote, stopNote, stopAllNotes, preloadProgress, isPreloading } = useNotePlayer(
    volume,
    soundType,
    sustainActive,
    notes,
    enablePreload
  );

  // Connect sustain mode to note playback
  const { toggleSustain } = useSustainToggle(stopAllNotes, setSustainActive);

  /* ------------------ Input Handlers ------------------ */
  // Keyboard controls
  useKeyboardControls(
    notes,
    playNote,
    stopNote,
    (note) => flashNote(note, PIANO_CONFIG.KEY_HIGHLIGHT_DURATION_MS),
    deactivateNote
  );

  // Mouse and touch handlers
  const { handleMouseDown, handleMouseEnter, handleMouseUp } = useMouseControls(
    playNote,
    stopNote,
    flashNote,
    clearAllNotes
  );

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useTouchControls(
    playNote,
    stopNote,
    activateNote,
    deactivateNote
  );

  /* ------------------ Layout ------------------ */
  // Compute layout position for sharp keys
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

  /* ------------------ Render ------------------ */
  // Calculate adaptive colors
  const textColor = useMemo(() => getContrastColor(bgColor), [bgColor]);
  const shadowColor = useMemo(() => getShadowColor(bgColor), [bgColor]);

  return (
    <main 
      className="flex flex-col items-center justify-center min-h-screen select-none transition-colors duration-500"
      style={{ 
        backgroundColor: bgColor,
        color: textColor,
        "--foreground": textColor,
      } as React.CSSProperties}
    >
      <h1 
        className="text-4xl font-bold mb-8 tracking-tight"
        style={{ textShadow: `0 4px 12px ${shadowColor}` }}
      >
        🎹 Playable Piano
      </h1>

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
        textColor={textColor}
      />

      <div
        className="relative flex flex-col items-center piano-scale-transition"
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

        <div className="flex flex-col items-center mt-8">
          <button
            onClick={toggleSustain}
            className={`h-6 w-24 rounded-full transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg ${
              sustainActive
                ? "bg-green-500 shadow-green-500/40"
                : "bg-gray-600 hover:bg-gray-500"
            }`}
            aria-label="Toggle sustain mode"
          >
             <span className="text-xs font-bold text-white uppercase tracking-wider">
                {sustainActive ? "Sustain" : "Normal"}
             </span>
          </button>
          <p className="text-sm font-medium mt-3 opacity-80 text-center">
            Sustain Mode {sustainActive ? "(Active)" : "(Off)"} — Click or press Spacebar
          </p>
          <p className="text-sm font-medium mb-1 mt-2 opacity-60">
            Click, drag, touch, or use your keyboard to play notes
          </p>
        </div>
      </div>
    </main>
  );
}
