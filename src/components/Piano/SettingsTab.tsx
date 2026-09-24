import { motion } from "framer-motion";
import { Cable, Pipette, Volume1, Volume2, VolumeX } from "lucide-react";
import {
  BACKGROUND_SWATCHES,
  OCTAVE_RANGES,
  PIANO_SCALE,
  SHORT_SCREEN_OCTAVE_RANGES,
  SHORT_SCREEN_QUERY,
} from "@/lib/config";
import type { PianoSettings } from "@/lib/settings";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Field, Segmented, Slider, ToggleChip } from "@/components/ui/controls";
import type { MidiStatus } from "./hooks/useMidiInput";

type UpdateSetting = <K extends keyof PianoSettings>(
  key: K,
  value: PianoSettings[K],
) => void;

export interface SettingsTabProps {
  settings: PianoSettings;
  updateSetting: UpdateSetting;
  pianoScale: number;
  autoScale: boolean;
  onOctaveChange: (start: number, end: number) => void;
  midiSupported: boolean;
  midiStatus: MidiStatus;
  midiDevices: readonly string[];
  onMidiConnect: () => void;
}

function VolumeIcon({ volume }: { volume: number }) {
  const Icon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  return (
    <Icon size={16} className="shrink-0 text-ui-muted" aria-hidden="true" />
  );
}

function MidiControl({
  supported,
  status,
  devices,
  onConnect,
}: {
  supported: boolean;
  status: MidiStatus;
  devices: readonly string[];
  onConnect: () => void;
}) {
  if (!supported) {
    return (
      <p className="flex h-8 items-center text-[13px] text-ui-subtle">
        Not available in this browser
      </p>
    );
  }

  if (status === "connected") {
    return (
      <p className="flex h-8 min-w-0 items-center gap-2 text-[13px]">
        <span
          className={`size-2 shrink-0 rounded-full ${
            devices.length > 0 ? "bg-green-500" : "bg-amber-400"
          }`}
        />
        <span className="truncate">
          {devices.length > 0 ? devices.join(", ") : "Waiting for a device…"}
        </span>
      </p>
    );
  }

  return (
    <div className="flex h-8 items-center gap-2">
      <button
        type="button"
        onClick={onConnect}
        disabled={status === "connecting"}
        className="flex h-8 items-center gap-1.5 rounded-lg border border-ui-border bg-ui-surface px-3 text-[13px] font-medium transition-colors hover:bg-ui-surface-hover disabled:opacity-60"
      >
        <Cable size={14} aria-hidden="true" />
        {status === "connecting"
          ? "Connecting…"
          : status === "denied"
            ? "Try again"
            : "Connect"}
      </button>
      {status === "denied" && (
        <span className="text-[11px] leading-snug text-danger">
          Access was blocked
        </span>
      )}
    </div>
  );
}

export function SettingsTab({
  settings,
  updateSetting,
  pianoScale,
  autoScale,
  onOctaveChange,
  midiSupported,
  midiStatus,
  midiDevices,
  onMidiConnect,
}: SettingsTabProps) {
  const isShortScreen = useMediaQuery(SHORT_SCREEN_QUERY);
  const ranges = isShortScreen
    ? OCTAVE_RANGES.slice(0, SHORT_SCREEN_OCTAVE_RANGES)
    : OCTAVE_RANGES;
  const solfegeVoice = settings.soundType === "Solfege";
  const { volume, bgColor } = settings;
  const customColor = !BACKGROUND_SWATCHES.some(
    (swatch) => swatch.color.toLowerCase() === bgColor.toLowerCase(),
  );

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="grid gap-x-7 gap-y-5 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3"
    >
      <Field
        label="Volume"
        htmlFor="piano-volume"
        value={`${Math.round(volume * 100)}%`}
      >
        <div className="flex h-8 items-center gap-2.5">
          <VolumeIcon volume={volume} />
          <Slider
            id="piano-volume"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) =>
              updateSetting("volume", parseFloat(e.target.value))
            }
            aria-valuetext={`${Math.round(volume * 100)} percent`}
          />
        </div>
      </Field>

      {/* Reserve the hint in both voices so switching doesn't refit the keyboard. */}
      <Field
        label="Octave range"
        hint={
          <span className={solfegeVoice ? undefined : "invisible"}>
            The Solfege voice covers one octave
          </span>
        }
      >
        <Segmented
          label="Octave range"
          size="sm"
          disabled={solfegeVoice}
          value={`${settings.startOctave}-${settings.endOctave}`}
          onChange={(value) => {
            const [start, end] = value.split("-").map(Number);
            if (start !== undefined && end !== undefined) {
              onOctaveChange(start, end);
            }
          }}
          options={ranges.map(([start, end]) => ({
            value: `${start}-${end}`,
            label: `C${start}–C${end}`,
            title: `${end - start} octave${end - start > 1 ? "s" : ""}`,
          }))}
        />
      </Field>

      <Field
        label="Zoom"
        htmlFor="piano-zoom"
        value={autoScale ? "Auto" : `${pianoScale.toFixed(2)}×`}
        action={
          !autoScale && (
            <button
              type="button"
              onClick={() => updateSetting("pianoScale", null)}
              className="rounded-md px-1.5 py-px text-[11px] font-semibold text-accent transition-colors hover:bg-ui-surface-hover"
              title="Zoom the keyboard to fit the screen"
            >
              Fit
            </button>
          )
        }
      >
        <div className="flex h-8 items-center">
          <Slider
            id="piano-zoom"
            min={PIANO_SCALE.MIN}
            max={PIANO_SCALE.MAX}
            step={PIANO_SCALE.STEP}
            value={pianoScale}
            onChange={(e) =>
              updateSetting("pianoScale", parseFloat(e.target.value))
            }
            aria-valuetext={`${pianoScale.toFixed(2)} times`}
          />
        </div>
      </Field>

      <Field label="Show">
        <div className="flex flex-wrap gap-1.5">
          <ToggleChip
            pressed={settings.solfegeEnabled}
            onChange={(value) => updateSetting("solfegeEnabled", value)}
          >
            Solfege
          </ToggleChip>
          <ToggleChip
            pressed={settings.noteNamesEnabled}
            onChange={(value) => updateSetting("noteNamesEnabled", value)}
          >
            Note names
          </ToggleChip>
          <ToggleChip
            pressed={settings.labelsEnabled}
            onChange={(value) => updateSetting("labelsEnabled", value)}
          >
            Shortcuts
          </ToggleChip>
          <ToggleChip
            pressed={settings.displayEnabled}
            onChange={(value) => updateSetting("displayEnabled", value)}
            title="The note readout and Sustain button above the keys. Space and a MIDI pedal still toggle sustain."
          >
            Note display
          </ToggleChip>
        </div>
      </Field>

      <Field label="Background">
        <div className="flex flex-wrap items-center gap-2">
          {BACKGROUND_SWATCHES.map((swatch) => {
            const selected =
              swatch.color.toLowerCase() === bgColor.toLowerCase();
            return (
              <button
                key={swatch.color}
                type="button"
                aria-label={swatch.name}
                aria-pressed={selected}
                title={swatch.name}
                onClick={() => updateSetting("bgColor", swatch.color)}
                className={`size-7 rounded-full border border-ui-border transition-transform hover:scale-110 ${
                  selected
                    ? "ring-2 ring-accent ring-offset-2 ring-offset-(--background)"
                    : ""
                }`}
                style={{ background: swatch.color }}
              />
            );
          })}
          <label
            title="Custom color"
            className={`relative flex size-7 cursor-pointer items-center justify-center rounded-full border border-ui-border transition-transform hover:scale-110 ${
              customColor
                ? "ring-2 ring-accent ring-offset-2 ring-offset-(--background)"
                : ""
            }`}
            style={{
              background: customColor
                ? bgColor
                : "conic-gradient(from 0deg, oklch(0.75 0.15 25), oklch(0.8 0.15 95), oklch(0.75 0.15 145), oklch(0.72 0.14 200), oklch(0.65 0.17 265), oklch(0.7 0.16 320), oklch(0.75 0.15 25))",
            }}
          >
            <Pipette
              size={13}
              className="text-white drop-shadow-[0_1px_1px_rgb(0_0_0/0.6)]"
              aria-hidden="true"
            />
            <input
              type="color"
              aria-label="Custom background color"
              value={bgColor}
              onChange={(e) => updateSetting("bgColor", e.target.value)}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          </label>
        </div>
      </Field>

      <Field
        label="MIDI keyboard"
        hint={
          midiSupported && midiStatus !== "connected"
            ? "Velocity and the sustain pedal are supported"
            : undefined
        }
      >
        <MidiControl
          supported={midiSupported}
          status={midiStatus}
          devices={midiDevices}
          onConnect={onMidiConnect}
        />
      </Field>
    </motion.div>
  );
}
