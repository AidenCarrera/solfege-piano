"use client";

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  type SetStateAction,
} from "react";

import { Note } from "@/lib/note";
import type { EffectNode } from "@/lib/effects";
import { generateNotes } from "@/lib/noteGenerator";
import {
  PIANO_CONFIG,
  PIANO_INSET,
  PIANO_SCALE,
  SHORT_SCREEN_QUERY,
  SOLFEGE_OCTAVE_RANGE,
  SoundType,
} from "@/lib/config";
import { useMediaQuery } from "@/hooks/useMediaQuery";

import { useSettings } from "./hooks/useSettings";
import { useFitScale } from "./hooks/useFitScale";
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

import { OrientationGate } from "@/components/OrientationGate";
import { PianoKey } from "./PianoKey";
import { ControlPanel } from "./ControlPanel";
import { PreloadProgress } from "./PreloadProgress";

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

  // Too short to show the controls and a playable keyboard at once: give the
  // keyboard the screen to itself and let the page scroll down to it.
  const isShortScreen = useMediaQuery(SHORT_SCREEN_QUERY);

  // A stored zoom is an explicit choice and wins; otherwise fit the screen.
  const viewportRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fit = useFitScale(viewportRef, headerRef, contentRef, isShortScreen);
  const autoScale = settings.pianoScale === null;
  const pianoScale = settings.pianoScale ?? fit?.scale ?? PIANO_SCALE.DEFAULT;

  // Memoized callbacks prevent re-rendering ControlPanel on note presses.
  // `null` hands the zoom back to the fit measurement.
  const setPianoScale = useCallback(
    (value: number | null) => updateSetting("pianoScale", value),
    [updateSetting],
  );
  const setVolume = useCallback(
    (value: number) => updateSetting("volume", value),
    [updateSetting],
  );
  const setEffectChain = useCallback(
    (value: SetStateAction<EffectNode[]>) =>
      updateSetting("effectChain", value),
    [updateSetting],
  );
  const setLabelsEnabled = useCallback(
    (value: boolean) => updateSetting("labelsEnabled", value),
    [updateSetting],
  );
  const setSolfegeEnabled = useCallback(
    (value: boolean) => updateSetting("solfegeEnabled", value),
    [updateSetting],
  );
  const setBgColor = useCallback(
    (value: string) => updateSetting("bgColor", value),
    [updateSetting],
  );
  const handleOctaveChange = useCallback(
    (start: number, end: number) =>
      patchSettings({ startOctave: start, endOctave: end }),
    [patchSettings],
  );

  useThemeTokens(bgColor);

  const handleSoundTypeChange = useCallback(
    (newSoundType: SoundType) => {
      // Solfege is only sampled for one octave, so pin the range.
      if (newSoundType === "Solfege") {
        const [start, end] = SOLFEGE_OCTAVE_RANGE;
        patchSettings({
          soundType: newSoundType,
          startOctave: start,
          endOctave: end,
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

  const keyboardRef = useTouchControls(
    playNote,
    stopNote,
    activateNote,
    deactivateNote,
  );

  usePageInactive(
    useCallback(() => {
      stopAllNotes();
      clearAllNotes();
    }, [stopAllNotes, clearAllNotes]),
  );

  /** Derive key position offsets once per note range. */
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
    <>
      <OrientationGate />

      <main
        // Unpadded, so the probe below spans the true viewport width; the
        // keyboard's own side margin comes from `sideInset`.
        className="relative flex grow flex-col items-center select-none transition-colors duration-500"
        style={{
          // `--foreground` is published on :root by useThemeTokens.
          color: textColor,
          // Centres the column when it fits on one screen; `safe` yields to
          // scrolling rather than hiding the top of anything taller, which is
          // the normal case on a phone.
          justifyContent: "safe center",
        }}
      >
        {/*
         * A stand-in for the viewport, measured instead of any container the
         * keyboard sits in — nothing the keyboard does can resize a probe, so
         * the fit cannot chase its own result. Absolute, so it takes no space,
         * and in `svh` so it ignores a mobile browser's disappearing chrome
         * rather than resizing the keyboard mid-scroll.
         */}
        <div
          ref={viewportRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-svh"
        />
        {/* Measured as one block: everything above the keyboard that the
            keyboard has to share the screen with. */}
        <div
          ref={headerRef}
          className="flex w-full shrink-0 flex-col items-center px-3"
        >
          <h1
            className="mb-3 text-2xl font-bold tracking-tight sm:mb-4 sm:text-3xl md:mb-6 md:text-4xl"
            style={{ textShadow: `0 2px 8px ${shadowColor}` }}
          >
            Solfege Piano
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
            autoScale={autoScale}
            setPianoScale={setPianoScale}
            bgColor={bgColor}
            setBgColor={setBgColor}
            soundType={soundType}
            setSoundType={handleSoundTypeChange}
            startOctave={startOctave}
            endOctave={endOctave}
            onOctaveChange={handleOctaveChange}
            onResetSettings={resetSettings}
            textColor={textColor}
          />
        </div>

        {/* Sized from the same insets the fit measurement reserves, so the
            keyboard lands in exactly the space it was measured for. */}
        <section
          className="relative flex w-full shrink-0 flex-col"
          style={{
            paddingTop: PIANO_INSET.TOP_PX,
            paddingBottom: PIANO_INSET.BOTTOM_PX,
          }}
        >
          <PreloadProgress
            progress={preloadProgress}
            isPreloading={isPreloading}
            error={preloadError}
            onRetry={retryPreload}
          />

          <div
            className="flex justify-center overflow-x-auto"
            // `safe` keeps a keyboard zoomed past the fit reachable, by giving
            // up centring rather than pushing its left edge somewhere no
            // scroll can follow. The class above is the fallback where the
            // keyword is unsupported and this declaration is dropped.
            style={{ justifyContent: "safe center" }}
          >
            {/*
             * Carries the keyboard's *scaled* size as a real layout box.
             * A transform leaves the layout box at the unscaled size, which
             * would leave this flex row centring and scrolling something the
             * wrong shape; sizing the box here lets the keyboard scale from
             * its top-left corner and stay exactly where the box says it is.
             */}
            <div
              className={`shrink-0 ${fit === null ? "" : "piano-scale-transition"}`}
              style={
                fit === null
                  ? undefined
                  : {
                      width: fit.width * pianoScale,
                      height: fit.height * pianoScale,
                    }
              }
            >
              <div
                ref={contentRef}
                className={`flex w-max flex-col items-center ${
                  fit === null ? "" : "piano-scale-transition"
                }`}
                style={{
                  transform: `scale(${pianoScale})`,
                  // Before the first measurement the wrapper still has the
                  // content's unscaled width, so expand equally around its
                  // centred box. Once measured, the wrapper carries the real
                  // scaled width and the transform must match its top-left.
                  transformOrigin: fit === null ? "top center" : "top left",
                }}
              >
                <div
                  ref={keyboardRef}
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
                      showLabel={labelsEnabled}
                      showSolfege={solfegeEnabled}
                    />
                  ))}
                </div>

                <div
                  className="mt-5 flex flex-col items-center transform-gpu sm:mt-8"
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
                    aria-pressed={sustainActive}
                  >
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {sustainActive ? "Sustain" : "Dry"}
                    </span>
                  </button>
                  {/* Trailing margins would be dead space at the bottom of the
                      scaled block, and every row here costs the keyboard some
                      of the zoom it could have had — so the second line goes
                      entirely on screens too short to afford it. */}
                  <p className="mt-3 text-center text-sm font-medium opacity-80">
                    Sustain Mode {sustainActive ? "(Active)" : "(Off)"} — Click
                    or press Spacebar
                  </p>
                  <p className="mt-1.5 hidden text-sm font-medium opacity-60 sm:block">
                    Click, drag, touch, or use your keyboard to play notes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
