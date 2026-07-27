"use client";

import { useState, useMemo, useCallback } from "react";

import { Note } from "@/lib/note";
import { generateNotes } from "@/lib/noteGenerator";
import {
  PIANO_CONFIG,
  SOLFEGE_OCTAVE_RANGE,
  scaleForOctaveSpan,
  SoundType,
} from "@/lib/config";

import { useSettings } from "./hooks/useSettings";
import { useViewportScale } from "./hooks/useViewportScale";
import { useNotePlayer } from "./hooks/useNotePlayer";
import { useKeyboardControls } from "./hooks/useKeyboardControls";
import { useMouseControls } from "./hooks/useMouseControls";
import { useTouchControls } from "./hooks/useTouchControls";
import { useThemeTokens } from "./hooks/useThemeTokens";
import { useSustainToggle } from "./hooks/useSustainToggle";
import { useActiveNotes } from "./hooks/useActiveNotes";
import { useDeferredPreload } from "./hooks/useDeferredPreload";
import { usePageInactive } from "./hooks/usePageInactive";
import { getContrastColor, getShadowColor } from "@/lib/colorUtils";

import { PianoKey } from "./PianoKey";
import { ControlPanel } from "./ControlPanel";
import { PreloadProgress } from "./PreloadProgress";

/** Extra bottom margin per unit of zoom, keeping the keyboard clear of the fold. */
const SCALE_MARGIN_PX = 200;

export function Piano() {
  const { activeNotes, activateNote, deactivateNote, clearAllNotes } =
    useActiveNotes();

  const { settings, updateSetting, patchSettings, resetSettings } =
    useSettings();
  const {
    volume,
    effectChain,
    labelsEnabled,
    solfegeEnabled,
    bgColor,
    soundType,
    startOctave,
    endOctave,
  } = settings;

  // A stored zoom is an explicit choice and wins; otherwise follow the viewport.
  const viewportScale = useViewportScale();
  const pianoScale = settings.pianoScale ?? viewportScale;
  const setPianoScale = useCallback(
    (value: number) => updateSetting("pianoScale", value),
    [updateSetting],
  );

  useThemeTokens(bgColor);

  const handleSoundTypeChange = useCallback(
    (newSoundType: SoundType) => {
      // Solfege is only sampled for one octave, so pin the range and zoom.
      if (newSoundType === "Solfege") {
        const [start, end] = SOLFEGE_OCTAVE_RANGE;
        patchSettings({
          soundType: newSoundType,
          startOctave: start,
          endOctave: end,
          pianoScale: scaleForOctaveSpan(end - start + 1),
        });
        return;
      }
      updateSetting("soundType", newSoundType);
    },
    [patchSettings, updateSetting],
  );

  const notes: Note[] = useMemo(
    () => generateNotes(startOctave, endOctave),
    [startOctave, endOctave],
  );

  const [enablePreload, setEnablePreload] = useState(false);
  const beginPreload = useCallback(() => setEnablePreload(true), []);
  useDeferredPreload(beginPreload, PIANO_CONFIG.PRELOAD_DELAY_MS);

  const [sustainActive, setSustainActive] = useState(false);

  const {
    playNote,
    stopNote,
    stopAllNotes,
    preloadProgress,
    isPreloading,
    preloadError,
    retryPreload,
  } = useNotePlayer({
    volume,
    effectChain,
    soundType,
    sustainMode: sustainActive,
    notes,
    enablePreload,
  });

  const { toggleSustain } = useSustainToggle(stopAllNotes, setSustainActive);

  useKeyboardControls(notes, playNote, stopNote, activateNote, deactivateNote);

  const { handleMouseDown, handleMouseEnter, handleMouseUp } = useMouseControls(
    playNote,
    stopNote,
    activateNote,
    deactivateNote,
    clearAllNotes,
  );

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTouchCancel,
  } = useTouchControls(playNote, stopNote, activateNote, deactivateNote);

  usePageInactive(
    useCallback(() => {
      stopAllNotes();
      clearAllNotes();
    }, [stopAllNotes, clearAllNotes]),
  );

  /**
   * Sharp keys are absolutely positioned over the boundary between their
   * preceding natural key and the next one. Offsets are derived once per note
   * range rather than per render, so every key can be memoized.
   */
  const keys = useMemo(() => {
    const naturalIndex = new Map<string, number>();
    notes
      .filter((note) => !note.isSharp)
      .forEach((note, index) => naturalIndex.set(note.name, index));

    return notes.map((note) => {
      const index = note.isSharp
        ? naturalIndex.get(note.naturalName)
        : undefined;
      return {
        note,
        leftRem:
          index === undefined
            ? 0
            : (index + 1) * PIANO_CONFIG.WHITE_KEY_WIDTH_REM,
      };
    });
  }, [notes]);

  const textColor = useMemo(() => getContrastColor(bgColor), [bgColor]);
  const shadowColor = useMemo(() => getShadowColor(bgColor), [bgColor]);

  return (
    <main
      className="flex flex-col items-center justify-center min-h-screen pb-16 md:pb-36 select-none transition-colors duration-500"
      // `--foreground` is published on :root by useThemeTokens.
      style={{ color: textColor }}
    >
      <h1
        className="text-3xl md:text-4xl font-bold mb-4 md:mb-6 tracking-tight"
        style={{ textShadow: `0 2px 8px ${shadowColor}` }}
      >
        Solfege Piano
      </h1>

      <ControlPanel
        volume={volume}
        setVolume={(value) => updateSetting("volume", value)}
        effectChain={effectChain}
        setEffectChain={(value) => updateSetting("effectChain", value)}
        labelsEnabled={labelsEnabled}
        setLabelsEnabled={(value) => updateSetting("labelsEnabled", value)}
        solfegeEnabled={solfegeEnabled}
        setSolfegeEnabled={(value) => updateSetting("solfegeEnabled", value)}
        pianoScale={pianoScale}
        setPianoScale={setPianoScale}
        bgColor={bgColor}
        setBgColor={(value) => updateSetting("bgColor", value)}
        soundType={soundType}
        setSoundType={handleSoundTypeChange}
        startOctave={startOctave}
        endOctave={endOctave}
        onOctaveChange={(start, end) =>
          patchSettings({ startOctave: start, endOctave: end })
        }
        onResetSettings={resetSettings}
        textColor={textColor}
      />

      <div
        className="relative flex flex-col items-center piano-scale-transition"
        style={{
          transform: `scale(${pianoScale})`,
          transformOrigin: "top center",
          marginBottom: `${(pianoScale - 1) * SCALE_MARGIN_PX}px`,
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
          {keys.map(({ note, leftRem }) => (
            <PianoKey
              key={note.name}
              note={note}
              isActive={activeNotes.has(note.name)}
              leftRem={leftRem}
              onMouseDown={handleMouseDown}
              onMouseEnter={handleMouseEnter}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
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
