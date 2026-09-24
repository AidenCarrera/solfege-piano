"use client";

import React from "react";
import { Maximize2, MicVocal, Minimize2, Piano } from "lucide-react";
import type { SoundType } from "@/lib/config";
import {
  PITCH_CLASSES,
  SCALES,
  SCALE_IDS,
  tonicName,
  type ScaleId,
} from "@/lib/theory";
import { useFullscreen } from "@/hooks/useFullscreen";
import { IconButton, Segmented } from "@/components/ui/controls";
import { HelpDialog } from "./HelpDialog";

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.72 0.17 25)" />
          <stop offset="50%" stopColor="oklch(0.68 0.16 320)" />
          <stop offset="100%" stopColor="oklch(0.6 0.18 265)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#logo-gradient)" />
      <g fill="#fff">
        <rect x="7" y="8" width="5.5" height="16" rx="1.5" />
        <rect x="13.25" y="8" width="5.5" height="16" rx="1.5" />
        <rect x="19.5" y="8" width="5.5" height="16" rx="1.5" />
      </g>
      <g fill="#16161b">
        <rect x="10.75" y="8" width="3.75" height="9.5" rx="1" />
        <rect x="17.5" y="8" width="3.75" height="9.5" rx="1" />
      </g>
    </svg>
  );
}

const SOUND_SEGMENTS = [
  {
    value: "Piano",
    label: (
      <>
        <Piano size={15} aria-hidden="true" />
        <span className="max-sm:sr-only">Piano</span>
      </>
    ),
    title: "Sampled grand piano",
  },
  {
    value: "Solfege",
    label: (
      <>
        <MicVocal size={15} aria-hidden="true" />
        <span className="max-sm:sr-only">Solfege</span>
      </>
    ),
    title: "A voice sings each syllable",
  },
] as const;

export interface TopBarProps {
  tonic: number;
  scale: ScaleId;
  soundType: SoundType;
  onTonicChange: (tonic: number) => void;
  onScaleChange: (scale: ScaleId) => void;
  onSoundTypeChange: (soundType: SoundType) => void;
  midiDevices: readonly string[];
}

function TopBarComponent({
  tonic,
  scale,
  soundType,
  onTonicChange,
  onScaleChange,
  onSoundTypeChange,
  midiDevices,
}: TopBarProps) {
  const fullscreen = useFullscreen();
  // The Solfege voice is recorded in C.
  const keyLocked = soundType === "Solfege";
  const displayedTonic = keyLocked ? 0 : tonic;

  return (
    <header className="flex w-full max-w-5xl flex-wrap items-center gap-x-2 gap-y-2 sm:gap-x-3">
      <div className="mr-auto flex items-center gap-2.5">
        <Logo />
        <h1 className="text-lg font-semibold tracking-tight">Solfege Piano</h1>
      </div>

      {/* Narrow screens give the key and sound pickers a row of their own. */}
      <div className="order-last flex w-full items-center gap-2 sm:order-none sm:w-auto">
        <div
          className="flex h-9 min-w-0 flex-1 items-center rounded-lg border border-ui-border bg-ui-surface sm:flex-initial"
          title={
            keyLocked
              ? "The Solfege voice was recorded in C, so the key stays on C"
              : undefined
          }
        >
          <span className="pr-0.5 pl-3 text-[11px] font-semibold tracking-wider text-ui-subtle uppercase">
            Key
          </span>
          <select
            aria-label="Key (the note that is Do)"
            value={displayedTonic}
            disabled={keyLocked}
            onChange={(e) => onTonicChange(Number(e.target.value))}
            className="h-full border-0 bg-transparent text-sm font-semibold hover:bg-transparent"
          >
            {PITCH_CLASSES.map((pitchClass) => (
              <option key={pitchClass} value={pitchClass}>
                {tonicName(pitchClass, scale)}
              </option>
            ))}
          </select>
          <span aria-hidden="true" className="h-5 w-px bg-ui-border" />
          <select
            aria-label="Scale"
            value={scale}
            onChange={(e) => onScaleChange(e.target.value as ScaleId)}
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm font-medium hover:bg-transparent sm:max-w-40"
          >
            {SCALE_IDS.map((id) => (
              <option key={id} value={id}>
                {SCALES[id].label}
              </option>
            ))}
          </select>
        </div>

        <Segmented
          label="Sound"
          options={SOUND_SEGMENTS}
          value={soundType}
          onChange={onSoundTypeChange}
        />

        {midiDevices.length > 0 && (
          <span
            className="hidden h-9 items-center gap-1.5 rounded-lg border border-ui-border px-2.5 text-xs font-medium text-ui-muted sm:flex"
            title={`MIDI: ${midiDevices.join(", ")}`}
          >
            <span className="size-1.5 rounded-full bg-green-500 shadow-[0_0_6px] shadow-green-500" />
            MIDI
          </span>
        )}
      </div>

      <div className="flex items-center">
        <HelpDialog context={{ tonic: displayedTonic, scale, soundType }} />
        {fullscreen.supported && (
          <IconButton
            label={fullscreen.isFullscreen ? "Exit full screen" : "Full screen"}
            onClick={fullscreen.toggle}
          >
            {fullscreen.isFullscreen ? (
              <Minimize2 size={17} />
            ) : (
              <Maximize2 size={17} />
            )}
          </IconButton>
        )}
      </div>
    </header>
  );
}

export const TopBar = React.memo(TopBarComponent);
