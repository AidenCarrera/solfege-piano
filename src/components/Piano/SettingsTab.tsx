import React from "react";
import { motion } from "framer-motion";
import { SoundType, SOUND_OPTIONS } from "@/lib/config";
import { OCTAVE_MAP } from "./ControlPanelTypes";

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
  const sliderValue =
    Object.entries(OCTAVE_MAP).find(
      ([, range]) => range[0] === startOctave && range[1] === endOctave,
    )?.[0] ?? "2";

  const handleOctaveSlider = (val: number) => {
    const range = OCTAVE_MAP[val];
    if (!range) return;
    const [start, end] = range;
    onOctaveChange(start, end);
    const scaleMap: Record<number, number> = { 2: 1.5, 3: 1.4, 4: 1.0, 5: 0.8 };
    setPianoScale(scaleMap[end - start + 1] ?? 1.5);
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
        <label
          htmlFor="sound-type"
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--panel-muted)" }}
        >
          Sound Type
        </label>
        <select
          id="sound-type"
          value={soundType}
          onChange={(e) => setSoundType(e.target.value as SoundType)}
          className="text-sm"
        >
          {SOUND_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label
            htmlFor="octave-range"
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--panel-muted)" }}
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
        <input
          id="octave-range"
          type="range"
          min={1}
          max={4}
          step={1}
          value={parseInt(sliderValue)}
          onChange={(e) => handleOctaveSlider(parseInt(e.target.value))}
          className="w-full"
          disabled={soundType === "Solfege"}
          aria-valuetext={`C${startOctave} to C${endOctave}`}
          aria-describedby={
            soundType === "Solfege" ? "octave-range-help" : undefined
          }
        />
        {soundType === "Solfege" && (
          <span
            id="octave-range-help"
            className="text-[10px]"
            style={{ color: "var(--panel-subtle)" }}
          >
            Locked to 1 octave in Solfege mode
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label
            htmlFor="piano-zoom"
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--panel-muted)" }}
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
        <input
          id="piano-zoom"
          type="range"
          min={0.5}
          max={2}
          step={0.01}
          value={pianoScale}
          onChange={(e) => setPianoScale(parseFloat(e.target.value))}
          className="w-full"
          aria-valuetext={`${pianoScale.toFixed(2)} times`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label
            htmlFor="piano-volume"
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--panel-muted)" }}
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

      <div className="flex flex-col gap-2">
        <label
          htmlFor="background-color"
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--panel-muted)" }}
        >
          Background
        </label>
        <div className="flex items-center gap-3">
          <input
            id="background-color"
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent p-0.5"
          />
          <span
            className="text-[11px] font-mono"
            style={{ color: "var(--panel-muted)" }}
          >
            {bgColor}
          </span>
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--panel-muted)" }}
        >
          Labels
        </legend>
        <label className="flex items-center gap-2.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={labelsEnabled}
            onChange={(e) => setLabelsEnabled(e.target.checked)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setLabelsEnabled(!labelsEnabled);
            }}
          />
          Keyboard
        </label>
        <label className="flex items-center gap-2.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={solfegeEnabled}
            onChange={(e) => setSolfegeEnabled(e.target.checked)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSolfegeEnabled(!solfegeEnabled);
            }}
          />
          Solfege
        </label>
      </fieldset>
    </motion.div>
  );
}
