import { motion } from "framer-motion";
import {
  OCTAVE_RANGES,
  PIANO_SCALE,
  SHORT_SCREEN_OCTAVE_RANGES,
  SHORT_SCREEN_QUERY,
  SoundType,
  SOUND_OPTIONS,
} from "@/lib/config";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export interface SettingsTabProps {
  volume: number;
  setVolume: (v: number) => void;
  soundType: SoundType;
  setSoundType: (s: SoundType) => void;
  startOctave: number;
  endOctave: number;
  onOctaveChange: (start: number, end: number) => void;
  pianoScale: number;
  autoScale: boolean;
  setPianoScale: (v: number | null) => void;
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
  autoScale,
  setPianoScale,
  bgColor,
  setBgColor,
  labelsEnabled,
  setLabelsEnabled,
  solfegeEnabled,
  setSolfegeEnabled,
}: SettingsTabProps) {
  const isShortScreen = useMediaQuery(SHORT_SCREEN_QUERY);
  const lastRange =
    (isShortScreen ? SHORT_SCREEN_OCTAVE_RANGES : OCTAVE_RANGES.length) - 1;

  const selectedRange = OCTAVE_RANGES.findIndex(
    ([start, end]) => start === startOctave && end === endOctave,
  );
  const sliderRange = Math.min(Math.max(selectedRange, 0), lastRange);

  const handleOctaveSlider = (index: number) => {
    const range = OCTAVE_RANGES[index];
    if (!range) return;

    const [start, end] = range;
    onOctaveChange(start, end);
    // Refit after changing the number of keys.
    setPianoScale(null);
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="grid grid-cols-2 gap-4 p-3 sm:grid-cols-3 sm:gap-6 sm:p-5 lg:grid-cols-4"
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
            // Prevent iOS from zooming on focus.
            className="h-8 w-full rounded-md pl-2.5 pr-6 text-left text-base font-medium sm:text-sm"
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
            max={lastRange}
            step={1}
            value={sliderRange}
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
          <div className="flex items-center gap-1.5">
            {!autoScale && (
              <button
                type="button"
                onClick={() => setPianoScale(null)}
                className="cursor-pointer rounded px-1.5 py-px text-[11px] font-medium transition-colors"
                style={{
                  background: "var(--panel-surface)",
                  color: "var(--panel-fg)",
                }}
                title="Zoom the keyboard to fit the screen"
              >
                Fit
              </button>
            )}
            <span
              className="text-[11px] font-mono px-1.5 py-px rounded"
              style={{ background: "var(--panel-surface)" }}
            >
              {autoScale ? "Auto" : `${pianoScale.toFixed(2)}×`}
            </span>
          </div>
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
