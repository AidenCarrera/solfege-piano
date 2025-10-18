"use client";
import { SOUND_OPTIONS, type SoundType } from "../../lib/config";

/**
 * PianoControls Component
 *
 * Provides UI controls for piano configuration
 */
type Props = {
  volume: number;
  setVolume: (v: number) => void;
  labelsEnabled: boolean;
  setLabelsEnabled: (b: boolean) => void;
  solfegeEnabled: boolean;
  setSolfegeEnabled: (b: boolean) => void;
  pianoScale: number;
  setPianoScale: (v: number) => void;
  bgColor: string;
  setBgColor: (v: string) => void;
  soundType: SoundType;
  setSoundType: (s: SoundType) => void;
};

export default function PianoControls({
  volume,
  setVolume,
  labelsEnabled,
  setLabelsEnabled,
  solfegeEnabled,
  setSolfegeEnabled,
  pianoScale,
  setPianoScale,
  bgColor,
  setBgColor,
  soundType,
  setSoundType,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-6 mb-8 items-center justify-center text-foreground">
      {/* ----- Volume Control ----- */}
      <div className="flex flex-col items-start">
        <label className="text-sm font-medium mb-1">
          Volume: {volume.toFixed(2)}
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-40"
        />
      </div>

      {/* ----- Label Toggles ----- */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={labelsEnabled}
            onChange={(e) => setLabelsEnabled(e.target.checked)}
          />
          Keyboard Labels
        </label>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={solfegeEnabled}
            onChange={(e) => setSolfegeEnabled(e.target.checked)}
          />
          Solfege Labels
        </label>
      </div>

      {/* ----- Piano Scale (Zoom) ----- */}
      <div className="flex flex-col items-start">
        <label className="text-sm font-medium mb-1">
          Piano Scale: {pianoScale.toFixed(2)}
        </label>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.01}
          value={pianoScale}
          onChange={(e) => setPianoScale(parseFloat(e.target.value))}
          className="w-40"
        />
      </div>

      {/* ----- Background Color Picker ----- */}
      <div className="flex flex-col items-start">
        <label className="text-sm font-medium mb-1">Background:</label>
        <input
          type="color"
          value={bgColor}
          onChange={(e) => setBgColor(e.target.value)}
          className="w-16 h-8 rounded-md border border-[var(--input-border)]"
        />
      </div>

      {/* ----- Sound Type Selector ----- */}
      <div className="flex flex-col items-start">
        <label className="text-sm font-medium mb-1">Sound Type:</label>
        <select
          value={soundType}
          onChange={(e) => setSoundType(e.target.value as SoundType)}
          className="px-2 py-1 border rounded-md"
        >
          {SOUND_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
