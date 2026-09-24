"use client";

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  type SetStateAction,
} from "react";

import type { EffectNode } from "@/lib/effects";
import { generateNotes } from "@/lib/noteGenerator";
import {
  PIANO_CONFIG,
  PIANO_INSET,
  PIANO_SCALE,
  SHORT_SCREEN_QUERY,
  SOLFEGE_OCTAVE_RANGE,
  type SoundType,
} from "@/lib/config";
import { analyzeNote, keyName, prefersFlats, type ScaleId } from "@/lib/theory";
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
import { useMidiInput } from "./hooks/useMidiInput";
import { useEarTraining } from "./hooks/useEarTraining";

import { OrientationGate } from "@/components/OrientationGate";
import { PianoKey } from "./PianoKey";
import { ControlPanel } from "./ControlPanel";
import { PianoDisplay } from "./PianoDisplay";
import { TopBar } from "./TopBar";
import type { SettingsTabProps } from "./SettingsTab";
import type { EarTrainingTabProps } from "./EarTrainingTab";

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
    noteNamesEnabled,
    bgColor,
    soundType,
    startOctave,
    endOctave,
    scale,
  } = settings;
  // The Solfege voice is recorded in C, so its syllables are fixed.
  const tonic = soundType === "Solfege" ? 0 : settings.tonic;

  const isShortScreen = useMediaQuery(SHORT_SCREEN_QUERY);

  const viewportRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fit = useFitScale(
    {
      viewport: viewportRef,
      header: headerRef,
      frame: frameRef,
      box: boxRef,
      content: contentRef,
    },
    isShortScreen,
  );
  const autoScale = settings.pianoScale === null;
  const pianoScale = settings.pianoScale ?? fit?.scale ?? PIANO_SCALE.DEFAULT;

  const setEffectChain = useCallback(
    (value: SetStateAction<EffectNode[]>) =>
      updateSetting("effectChain", value),
    [updateSetting],
  );

  useThemeTokens(bgColor);

  const notes = useMemo(
    () => generateNotes(startOctave, endOctave),
    [startOctave, endOctave],
  );
  const notesByName = useMemo(
    () => new Map(notes.map((note) => [note.name, note])),
    [notes],
  );
  const notesByMidi = useMemo(
    () => new Map(notes.map((note) => [note.midi, note])),
    [notes],
  );
  const theoryByName = useMemo(
    () =>
      new Map(
        notes.map((note) => [
          note.name,
          analyzeNote(note.midi, { tonic, scale, soundType }),
        ]),
      ),
    [notes, tonic, scale, soundType],
  );
  const flats = prefersFlats(tonic, scale);
  const keyLabel = keyName(tonic, scale);

  const [enablePreload, setEnablePreload] = useState(false);
  const beginPreload = useCallback(() => setEnablePreload(true), []);
  useDeferredPreload(beginPreload, PIANO_CONFIG.PRELOAD_DELAY_MS);

  // The player needs sustain state, and releasing sustain needs the player.
  const releaseHeldOverRef = useRef<() => void>(() => {});
  const handleSustainRelease = useCallback(
    () => releaseHeldOverRef.current(),
    [],
  );
  const { sustainActive, setSustain, toggleSustain } =
    useSustainToggle(handleSustainRelease);

  const {
    playNote,
    stopNote,
    releaseNotes,
    stopAllNotes,
    isReady,
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

  // Lifting the pedal stops ringing notes but keeps the ones still held.
  useEffect(() => {
    releaseHeldOverRef.current = () =>
      releaseNotes(
        notes
          .filter((note) => !activeNotes.has(note.name))
          .map((note) => note.name),
      );
  });

  const candidates = useMemo(
    () => notes.filter((note) => theoryByName.get(note.name)?.inScale),
    [notes, theoryByName],
  );
  const [playReference, setPlayReference] = useState(true);
  const {
    state: practice,
    keyFeedback,
    start: startPractice,
    stop: stopPractice,
    replay: replayPractice,
    reveal: revealPractice,
    next: nextPractice,
    reset: resetPractice,
    handleNote: reportNote,
  } = useEarTraining({
    candidates,
    notes,
    tonic,
    playReference,
    playNote,
    releaseNotes,
  });

  const playUserNote = useCallback(
    (noteName: string, velocity?: number) => {
      playNote(noteName, velocity);
      reportNote(noteName);
    },
    [playNote, reportNote],
  );

  useKeyboardControls(
    notes,
    playUserNote,
    stopNote,
    activateNote,
    deactivateNote,
  );

  const { handleMouseDown, handleMouseEnter, handleMouseUp } = useMouseControls(
    playUserNote,
    stopNote,
    activateNote,
    deactivateNote,
    clearAllNotes,
  );

  const keyboardRef = useTouchControls(
    playUserNote,
    stopNote,
    activateNote,
    deactivateNote,
  );

  const midi = useMidiInput({
    onNoteOn: (midiNote, velocity) => {
      const note = notesByMidi.get(midiNote);
      if (!note) return;
      playUserNote(note.name, velocity);
      activateNote(note.name);
    },
    onNoteOff: (midiNote) => {
      const note = notesByMidi.get(midiNote);
      if (!note) return;
      stopNote(note.name);
      deactivateNote(note.name);
    },
    onSustain: setSustain,
  });

  usePageInactive(
    useCallback(() => {
      stopAllNotes();
      clearAllNotes();
    }, [stopAllNotes, clearAllNotes]),
  );

  const handleSoundTypeChange = useCallback(
    (newSoundType: SoundType) => {
      if (newSoundType === soundType) return;
      resetPractice();
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
    [soundType, resetPractice, patchSettings, updateSetting],
  );

  const handleTonicChange = useCallback(
    (value: number) => {
      resetPractice();
      updateSetting("tonic", value);
    },
    [resetPractice, updateSetting],
  );

  const handleScaleChange = useCallback(
    (value: ScaleId) => {
      resetPractice();
      updateSetting("scale", value);
    },
    [resetPractice, updateSetting],
  );

  const handleOctaveChange = useCallback(
    (start: number, end: number) => {
      if (start === startOctave && end === endOctave) return;
      resetPractice();
      // Refit after changing the number of keys.
      patchSettings({ startOctave: start, endOctave: end, pianoScale: null });
    },
    [startOctave, endOctave, resetPractice, patchSettings],
  );

  const handleResetSettings = useCallback(() => {
    resetPractice();
    resetSettings();
  }, [resetPractice, resetSettings]);

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

  const settingsTab = useMemo<SettingsTabProps>(
    () => ({
      settings,
      updateSetting,
      pianoScale,
      autoScale,
      onOctaveChange: handleOctaveChange,
      midiSupported: midi.supported,
      midiStatus: midi.status,
      midiDevices: midi.devices,
      onMidiConnect: midi.connect,
    }),
    [
      settings,
      updateSetting,
      pianoScale,
      autoScale,
      handleOctaveChange,
      midi.supported,
      midi.status,
      midi.devices,
      midi.connect,
    ],
  );

  const earTrainingTab = useMemo<EarTrainingTabProps>(
    () => ({
      practice,
      ready: isReady,
      keyLabel,
      rangeLabel: `C${startOctave} and C${endOctave}`,
      candidateCount: candidates.length,
      soundType,
      playReference,
      setPlayReference,
      onStart: startPractice,
      onStop: stopPractice,
      onReplay: replayPractice,
      onReveal: revealPractice,
      onNext: nextPractice,
    }),
    [
      practice,
      isReady,
      keyLabel,
      startOctave,
      endOctave,
      candidates.length,
      soundType,
      playReference,
      startPractice,
      stopPractice,
      replayPractice,
      revealPractice,
      nextPractice,
    ],
  );

  return (
    <>
      <OrientationGate />

      <main
        className="relative flex grow flex-col items-center select-none"
        style={{
          // Avoid hiding the top when content exceeds the viewport.
          justifyContent: "safe center",
        }}
      >
        {/* Stable viewport probe for keyboard fit calculations. */}
        <div
          ref={viewportRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-svh"
        />
        <div
          ref={headerRef}
          className="flex w-full shrink-0 flex-col items-center gap-3 px-3 pt-3 sm:px-5 sm:pt-4"
        >
          <TopBar
            tonic={tonic}
            scale={scale}
            soundType={soundType}
            onTonicChange={handleTonicChange}
            onScaleChange={handleScaleChange}
            onSoundTypeChange={handleSoundTypeChange}
            midiDevices={midi.devices}
          />

          <ControlPanel
            settingsTab={settingsTab}
            earTrainingTab={earTrainingTab}
            effectChain={effectChain}
            setEffectChain={setEffectChain}
            onResetSettings={handleResetSettings}
          />
        </div>

        <section
          aria-label="Piano"
          className="relative flex w-full shrink-0 flex-col"
          style={{
            paddingTop: PIANO_INSET.TOP_PX,
            // The footer follows the section and fills the rest of the inset.
            paddingBottom: PIANO_INSET.BOTTOM_PX - PIANO_INSET.FOOTER_PX,
          }}
        >
          <div
            className="piano-scroll-region flex overflow-x-auto"
            // Keep an oversized keyboard's left edge reachable.
            style={{ justifyContent: "safe center" }}
          >
            <div ref={frameRef} className="piano-cabinet shrink-0">
              <div className="cabinet-rail">
                <PianoDisplay
                  activeNotes={activeNotes}
                  notesByName={notesByName}
                  theoryByName={theoryByName}
                  keyLabel={keyLabel}
                  flats={flats}
                  loading={{
                    isPreloading,
                    progress: preloadProgress,
                    error: preloadError,
                    onRetry: retryPreload,
                  }}
                  practice={practice}
                  playReference={playReference}
                />
                <button
                  type="button"
                  onClick={toggleSustain}
                  aria-pressed={sustainActive}
                  className="sustain-button"
                  title="Sustain (Space)"
                >
                  <span className="sustain-led" aria-hidden="true" />
                  <span className="flex flex-col items-start leading-tight">
                    <span className="text-[13px] font-semibold">Sustain</span>
                    <span className="text-[10px] font-medium text-white/45">
                      {sustainActive ? "On" : "Off"}
                      <span className="max-sm:hidden"> · Space</span>
                    </span>
                  </span>
                </button>
              </div>

              <div className="cabinet-felt" />

              {/* Give the transformed keyboard an equally scaled layout box. */}
              <div
                ref={boxRef}
                className={`relative shrink-0 ${fit === null ? "" : "piano-scale-transition"}`}
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
                  className={`w-max ${fit === null ? "" : "piano-scale-transition"}`}
                  style={{
                    // Render at natural size until the first measurement.
                    transform:
                      fit === null ? undefined : `scale(${pianoScale})`,
                    transformOrigin: "top left",
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
                    {keys.map(({ note, leftRem }) => {
                      const feedback = keyFeedback.get(note.name);
                      return (
                        <PianoKey
                          key={note.name}
                          note={note}
                          theory={theoryByName.get(note.name)!}
                          isActive={activeNotes.has(note.name)}
                          leftRem={leftRem}
                          onMouseDown={handleMouseDown}
                          onMouseEnter={handleMouseEnter}
                          onMouseUp={handleMouseUp}
                          showShortcut={labelsEnabled}
                          showSolfege={solfegeEnabled}
                          showNoteName={noteNamesEnabled}
                          showScale={scale !== "chromatic"}
                          feedback={feedback}
                          feedbackToken={
                            feedback ? practice.attempt : undefined
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
