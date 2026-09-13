import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  OCTAVE_RANGES,
  PIANO_SCALE,
  SHORT_SCREEN_OCTAVE_RANGES,
  SHORT_SCREEN_QUERY,
  SoundType,
  SOUND_OPTIONS,
} from "@/lib/config";
import type { PianoSettings, UpdateSetting } from "@/lib/settings";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export interface SettingsTabProps {
  settings: PianoSettings;
  updateSetting: UpdateSetting;
  /** Effective scale, which follows the responsive fit while `autoScale`. */
  pianoScale: number;
  autoScale: boolean;
  onSoundTypeChange: (soundType: SoundType) => void;
  onOctaveChange: (start: number, end: number) => void;
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      className="text-[11px] font-mono px-1.5 py-px rounded"
      style={{ background: "var(--panel-surface)" }}
    >
      {children}
    </span>
  );
}

/** One labelled control, sized so every cell of the grid lines up. */
function Field({
  label,
  htmlFor,
  action,
  help,
  children,
}: {
  label: string;
  htmlFor?: string;
  action?: ReactNode;
  help?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center h-5">
        {/* A checkbox group labels its own inputs, so it has no field id. */}
        {htmlFor ? (
          <label
            htmlFor={htmlFor}
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--panel-fg)" }}
          >
            {label}
          </label>
        ) : (
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--panel-fg)" }}
          >
            {label}
          </span>
        )}
        {action}
      </div>
      {children}
      {help}
    </div>
  );
}

export function SettingsTab({
  settings,
  updateSetting,
  pianoScale,
  autoScale,
  onSoundTypeChange,
  onOctaveChange,
}: SettingsTabProps) {
  const { volume, bgColor, soundType, startOctave, endOctave } = settings;
  const isShortScreen = useMediaQuery(SHORT_SCREEN_QUERY);
  const lastRange =
    (isShortScreen ? SHORT_SCREEN_OCTAVE_RANGES : OCTAVE_RANGES.length) - 1;

  const selectedRange = OCTAVE_RANGES.findIndex(
    ([start, end]) => start === startOctave && end === endOctave,
  );
  const sliderRange = Math.min(Math.max(selectedRange, 0), lastRange);
  const solfegeLocked = soundType === "Solfege";

  const setPianoScale = (value: number | null) =>
    updateSetting("pianoScale", value);

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
      <Field label="Sound Type" htmlFor="sound-type">
        <div className="h-8 flex items-center">
          <select
            id="sound-type"
            value={soundType}
            onChange={(e) => onSoundTypeChange(e.target.value as SoundType)}
            // text-base keeps iOS from zooming in when the select takes focus.
            className="h-8 w-full rounded-md pl-2.5 pr-6 text-left text-base font-medium sm:text-sm"
          >
            {SOUND_OPTIONS.map((s) => (
              <option key={s} className="text-left">
                {s}
              </option>
            ))}
          </select>
        </div>
      </Field>

      <Field
        label="Octave Range"
        htmlFor="octave-range"
        action={
          <Badge>
            C{startOctave}–C{endOctave}
          </Badge>
        }
        help={
          solfegeLocked && (
            <span
              id="octave-range-help"
              className="text-[10px]"
              style={{ color: "var(--panel-fg)" }}
            >
              Locked to 1 octave in Solfege mode
            </span>
          )
        }
      >
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
            disabled={solfegeLocked}
            aria-valuetext={`C${startOctave} to C${endOctave}`}
            aria-describedby={solfegeLocked ? "octave-range-help" : undefined}
          />
        </div>
      </Field>

      <Field
        label="Zoom"
        htmlFor="piano-zoom"
        action={
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
            <Badge>{autoScale ? "Auto" : `${pianoScale.toFixed(2)}×`}</Badge>
          </div>
        }
      >
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
      </Field>

      <Field
        label="Volume"
        htmlFor="piano-volume"
        action={<Badge>{Math.round(volume * 100)}%</Badge>}
      >
        <div className="h-8 flex items-center">
          <input
            id="piano-volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) =>
              updateSetting("volume", parseFloat(e.target.value))
            }
            className="w-full"
            aria-valuetext={`${Math.round(volume * 100)} percent`}
          />
        </div>
      </Field>

      <Field label="Background" htmlFor="background-color">
        <div className="h-8 flex items-center gap-3">
          <input
            id="background-color"
            type="color"
            value={bgColor}
            onChange={(e) => updateSetting("bgColor", e.target.value)}
            className="w-9.5 h-9.5 -my-1 rounded-lg border-0 cursor-pointer bg-transparent p-0"
          />
          <span
            className="text-[11px] font-mono"
            style={{ color: "var(--panel-fg)" }}
          >
            {bgColor}
          </span>
        </div>
      </Field>

      <Field label="Labels">
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={settings.labelsEnabled}
              onChange={(e) => updateSetting("labelsEnabled", e.target.checked)}
            />
            Keyboard
          </label>
          <label className="flex items-center gap-2.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={settings.solfegeEnabled}
              onChange={(e) =>
                updateSetting("solfegeEnabled", e.target.checked)
              }
            />
            Solfege
          </label>
        </div>
      </Field>
    </motion.div>
  );
}
