"use client";

import { useState, useMemo, useCallback, useEffect } from "react";

import { Note } from "@/lib/note";
import { generateNotes } from "@/lib/noteGenerator";
import { PIANO_CONFIG, SoundType } from "@/lib/config";

import { usePianoScale } from "./usePianoScale";
import { useNotePlayer } from "./useNotePlayer";
import { useKeyboardControls } from "./useKeyboardControls";
import { useMouseControls } from "./useMouseControls";
import { useTouchControls } from "./useTouchControls";
import { useBackgroundColor } from "./useBackgroundColor";
import { useSustainToggle } from "./useSustainToggle";
import { useActiveNotes } from "./useActiveNotes";
import { useDeferredPreload } from "./useDeferredPreload";
import { getContrastColor, getShadowColor } from "@/lib/colorUtils";

import PianoKey from "./PianoKey";
import ControlPanel from "./ControlPanel";
import PreloadProgress from "./PreloadProgress";
import { EffectNode, createEffectNode } from "@/lib/effects";

export default function Piano() {
  const {
    activeNotes,
    activateNote,
    deactivateNote,
    flashNote,
    clearAllNotes,
  } = useActiveNotes();

  const [volume, setVolume] = useState(PIANO_CONFIG.DEFAULT_VOLUME);
  const [effectChain, setEffectChain] = useState<EffectNode[]>(() => [
    createEffectNode("Reverb"),
  ]);
  const [labelsEnabled, setLabelsEnabled] = useState(
    PIANO_CONFIG.DEFAULT_LABELS_ENABLED,
  );
  const [solfegeEnabled, setSolfegeEnabled] = useState(
    PIANO_CONFIG.DEFAULT_SOLFEGE_ENABLED,
  );
  const [pianoScale, setPianoScale] = usePianoScale();
  const [bgColor, setBgColor] = useBackgroundColor();
  const [soundType, setSoundType] = useState<SoundType>("Piano");

  const [startOctave, setStartOctave] = useState(
    PIANO_CONFIG.DEFAULT_OCTAVE_RANGE[0] ?? 3,
  );
  const [endOctave, setEndOctave] = useState(
    PIANO_CONFIG.DEFAULT_OCTAVE_RANGE[1] ?? 4,
  );

  const handleSoundTypeChange = useCallback(
    (newSoundType: SoundType) => {
      if (newSoundType === "Solfege") {
        setStartOctave(3);
        setEndOctave(4);
        setPianoScale(1.5);
      }
      setSoundType(newSoundType);
    },
    [setPianoScale],
  );

  const notes: Note[] = useMemo(
    () => generateNotes(startOctave, endOctave),
    [startOctave, endOctave],
  );

  const [enablePreload, setEnablePreload] = useState(false);
  const beginPreload = useCallback(() => setEnablePreload(true), []);
  useDeferredPreload(beginPreload, 1500);

  const [sustainActive, setSustainActive] = useState(false);

  const {
    playNote,
    stopNote,
    stopAllNotes,
    preloadProgress,
    isPreloading,
    preloadError,
    retryPreload,
  } = useNotePlayer(
    volume,
    effectChain,
    soundType,
    sustainActive,
    notes,
    enablePreload,
  );

  const { toggleSustain } = useSustainToggle(stopAllNotes, setSustainActive);

  useKeyboardControls(
    notes,
    playNote,
    stopNote,
    (note) => flashNote(note, PIANO_CONFIG.KEY_HIGHLIGHT_DURATION_MS),
    deactivateNote,
  );

  const { handleMouseDown, handleMouseEnter, handleMouseUp } = useMouseControls(
    playNote,
    stopNote,
    flashNote,
    clearAllNotes,
  );

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  } = useTouchControls(playNote, stopNote, activateNote, deactivateNote);

  useEffect(() => {
    const releaseNotes = () => {
      stopAllNotes();
      clearAllNotes();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") releaseNotes();
    };

    window.addEventListener("blur", releaseNotes);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("blur", releaseNotes);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stopAllNotes, clearAllNotes]);

  // Sharp keys are positioned against their preceding white key.
  const whiteNotes = useMemo(() => notes.filter((n) => !n.isSharp), [notes]);
  const getSharpKeyPosition = (note: Note) => {
    const match = note.name.match(/^([A-G]s?)(\d+)$/);
    if (!match || !match[1] || !match[2]) return 0;
    const base = match[1].replace("s", "");
    const octave = match[2];
    const whiteIndex = whiteNotes.findIndex(
      (n) => n.name === `${base}${octave}`,
    );
    if (whiteIndex === -1) return 0;
    return (
      whiteIndex * PIANO_CONFIG.WHITE_KEY_WIDTH_REM +
      PIANO_CONFIG.WHITE_KEY_WIDTH_REM
    );
  };

  const textColor = useMemo(() => getContrastColor(bgColor), [bgColor]);
  const shadowColor = useMemo(() => getShadowColor(bgColor), [bgColor]);

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen pb-16 md:pb-36 select-none transition-colors duration-500"
      style={
        {
          color: textColor,
          "--foreground": textColor,
        } as React.CSSProperties
      }
    >
      <h1
        className="text-3xl md:text-4xl font-bold mb-4 md:mb-6 tracking-tight"
        style={{ textShadow: `0 4px 12px ${shadowColor}` }}
      >
        🎹 Playable Piano
      </h1>

      <ControlPanel
        volume={volume}
        setVolume={setVolume}
        effectChain={effectChain}
        setEffectChain={setEffectChain}
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
        <PreloadProgress
          progress={preloadProgress}
          isPreloading={isPreloading}
          error={preloadError}
          onRetry={retryPreload}
        />

        <div
          className="relative flex transform-gpu"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {notes.map((note) => (
            <PianoKey
              key={note.name}
              note={note}
              activeNotes={activeNotes}
              onMouseDown={() => handleMouseDown(note.fileName, note.name)}
              onMouseEnter={() => handleMouseEnter(note.fileName, note.name)}
              onMouseUp={handleMouseUp}
              onTouchStart={(e) =>
                handleTouchStart(e, note.fileName, note.name)
              }
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              getSharpKeyPosition={getSharpKeyPosition}
              showLabel={labelsEnabled}
              showSolfege={solfegeEnabled}
            />
          ))}
        </div>

        <div
          className="flex flex-col items-center mt-8 transform-gpu"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
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
              {sustainActive ? "Sustain" : "Dry"}
            </span>
          </button>
          <p className="text-sm font-medium mt-3 opacity-80 text-center">
            Sustain Mode {sustainActive ? "(Active)" : "(Off)"} — Click or press
            Spacebar
          </p>
          <p className="text-sm font-medium mb-1 mt-2 opacity-60">
            Click, drag, touch, or use your keyboard to play notes
          </p>
        </div>
      </div>
    </main>
  );
}
