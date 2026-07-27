import React from "react";
import { motion } from "framer-motion";
import {
  OCTAVE_RANGES,
  PIANO_SCALE,
  scaleForOctaveSpan,
  SoundType,
  SOUND_OPTIONS,
} from "@/lib/config";

export interface SettingsTabProps {
  volume: number;
  setVolume: (v: number) => void;
  soundType: SoundType;
  setSoundType: (s: SoundType) => void;
  startOctave: number;
  endOctave: number;
  onOctaveChange: (start: number, end: number) => void;
  pianoScale: number;
  setPianoScale: (v: number) => void;
  bgColor: string;
  setBgColor: (v: string) => void;
  labelsEnabled: boolean;
  setLabelsEnabled: (b: boolean) => void;
  solfegeEnabled: boolean;
  setSolfegeEnabled: (b: boolean) => void;
}

/**
 * Sound bank, octave range, zoom, volume, background, and label toggles.
 *
 * The octave slider selects an index into `OCTAVE_RANGES` rather than an
 * octave number, so the presets stay in one table and the slider needs no
 * validation of its own.
 */
export function SettingsTab({
  volume,
  setVolume,
  soundType,
  setSoundType,
  startOctave,
  endOctave,
  onOctaveChange,
  pianoScale,
  setPianoScale,
  bgColor,
  setBgColor,
  labelsEnabled,
  setLabelsEnabled,
  solfegeEnabled,
  setSolfegeEnabled,
}: SettingsTabProps) {
  const selectedRange = OCTAVE_RANGES.findIndex(
    ([start, end]) => start === startOctave && end === endOctave,
  );

  const handleOctaveSlider = (index: number) => {
    const range = OCTAVE_RANGES[index];
    if (!range) return;

    const [start, end] = range;
    onOctaveChange(start, end);
    setPianoScale(scaleForOctaveSpan(end - start + 1));
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center h-5">
          <label
            htmlFor="sound-type"
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--panel-fg)" }}
          >
            Sound Type
          </label>
        </div>
        <div className="h-8 flex items-center">
          <select
            id="sound-type"
            value={soundType}
            onChange={(e) => setSoundType(e.target.value as SoundType)}
            className="text-sm font-medium text-left pl-2.5 pr-6 rounded-md w-full h-8"
          >
            {SOUND_OPTIONS.map((s) => (
              <option key={s} className="text-left">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center h-5">
          <label
            htmlFor="octave-range"
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--panel-fg)" }}
          >
            Octave Range
          </label>
          <span
            className="text-[11px] font-mono px-1.5 py-px rounded"
            style={{ background: "var(--panel-surface)" }}
          >
            C{startOctave}–C{endOctave}
          </span>
        </div>
        <div className="h-8 flex items-center">
          <input
            id="octave-range"
            type="range"
            min={0}
            max={OCTAVE_RANGES.length - 1}
            step={1}
            value={Math.max(0, selectedRange)}
            onChange={(e) => handleOctaveSlider(Number(e.target.value))}
            className="w-full"
            disabled={soundType === "Solfege"}
            aria-valuetext={`C${startOctave} to C${endOctave}`}
            aria-describedby={
              soundType === "Solfege" ? "octave-range-help" : undefined
            }
          />
        </div>
        {soundType === "Solfege" && (
          <span
            id="octave-range-help"
            className="text-[10px]"
            style={{ color: "var(--panel-fg)" }}
          >
            Locked to 1 octave in Solfege mode
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center h-5">
          <label
            htmlFor="piano-zoom"
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--panel-fg)" }}
          >
            Zoom
          </label>
          <span
            className="text-[11px] font-mono px-1.5 py-px rounded"
            style={{ background: "var(--panel-surface)" }}
          >
            {pianoScale.toFixed(2)}×
          </span>
        </div>
        <div className="h-8 flex items-center">
          <input
            id="piano-zoom"
            type="range"
            min={PIANO_SCALE.MIN}
            max={PIANO_SCALE.MAX}
            step={PIANO_SCALE.STEP}
            value={pianoScale}
            onChange={(e) => setPianoScale(parseFloat(e.target.value))}
            className="w-full"
            aria-valuetext={`${pianoScale.toFixed(2)} times`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center h-5">
          <label
            htmlFor="piano-volume"
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--panel-fg)" }}
          >
            Volume
          </label>
          <span
            className="text-[11px] font-mono px-1.5 py-px rounded"
            style={{ background: "var(--panel-surface)" }}
          >
            {Math.round(volume * 100)}%
          </span>
        </div>
        <div className="h-8 flex items-center">
          <input
            id="piano-volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full"
            aria-valuetext={`${Math.round(volume * 100)} percent`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center h-5">
          <label
            htmlFor="background-color"
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--panel-fg)" }}
          >
            Background
          </label>
        </div>
        <div className="h-8 flex items-center gap-3">
          <input
            id="background-color"
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-9.5 h-9.5 -my-1 rounded-lg border-0 cursor-pointer bg-transparent p-0"
          />
          <span
            className="text-[11px] font-mono"
            style={{ color: "var(--panel-fg)" }}
          >
            {bgColor}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center h-5">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--panel-fg)" }}
          >
            Labels
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={labelsEnabled}
              onChange={(e) => setLabelsEnabled(e.target.checked)}
            />
            Keyboard
          </label>
          <label className="flex items-center gap-2.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={solfegeEnabled}
              onChange={(e) => setSolfegeEnabled(e.target.checked)}
            />
            Solfege
          </label>
        </div>
      </div>
    </motion.div>
  );
}
