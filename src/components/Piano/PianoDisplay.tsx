"use client";

import { useState, type ReactNode } from "react";
import { Check, Ear, RotateCcw, X } from "lucide-react";
import type { Note } from "@/lib/note";
import {
  analyzeHarmony,
  chordSymbol,
  degreeColor,
  mod12,
  pitchClassName,
  type NoteTheory,
} from "@/lib/theory";
import type { EarTrainingState } from "@/lib/earTraining";

interface Loading {
  isPreloading: boolean;
  progress: number;
  error: string | null;
  onRetry: () => void;
}

export interface PianoDisplayProps {
  activeNotes: ReadonlySet<string>;
  notesByName: ReadonlyMap<string, Note>;
  theoryByName: ReadonlyMap<string, NoteTheory>;
  keyLabel: string;
  flats: boolean;
  loading: Loading;
  practice: EarTrainingState;
  playReference: boolean;
}

// Keep the last chord on screen after its keys are released.
function useHeldOrLastNotes(activeNotes: ReadonlySet<string>) {
  const [previous, setPrevious] = useState(activeNotes);
  const [last, setLast] = useState<readonly string[]>([]);

  if (activeNotes !== previous) {
    setPrevious(activeNotes);
    const added = [...activeNotes].some((name) => !previous.has(name));
    if (added) setLast([...activeNotes]);
  }

  const held = activeNotes.size > 0;
  return { names: held ? [...activeNotes] : last, held };
}

function Syllable({
  theory,
  className = "",
}: {
  theory: NoteTheory;
  className?: string;
}) {
  return (
    <span
      className={`display-glow font-semibold ${className}`}
      style={{
        color: theory.colored ? degreeColor(theory.degree) : undefined,
      }}
    >
      {theory.syllable}
    </span>
  );
}

function Readout({
  lead,
  title,
  detail,
  dim = false,
}: {
  lead?: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  dim?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 transition-opacity duration-300 ${
        dim ? "opacity-55" : ""
      }`}
    >
      {lead && <div className="shrink-0 text-2xl leading-none">{lead}</div>}
      <div className="min-w-0">
        <div className="truncate text-[13px] leading-tight font-medium text-white/90">
          {title}
        </div>
        {detail && (
          <div className="truncate text-[11px] leading-tight text-white/50">
            {detail}
          </div>
        )}
      </div>
    </div>
  );
}

function NotesReadout({
  names,
  held,
  notesByName,
  theoryByName,
  flats,
}: {
  names: readonly string[];
  held: boolean;
  notesByName: ReadonlyMap<string, Note>;
  theoryByName: ReadonlyMap<string, NoteTheory>;
  flats: boolean;
}) {
  const notes = names
    .map((name) => notesByName.get(name))
    .filter((note): note is Note => note !== undefined)
    .sort((a, b) => a.midi - b.midi);
  const theories = notes
    .map((note) => theoryByName.get(note.name))
    .filter((theory): theory is NoteTheory => theory !== undefined);

  if (theories.length === 0) {
    return (
      <Readout
        lead={<Ear size={22} className="text-white/35" />}
        title="Play a key to see its solfege"
        detail="Keyboard, mouse, touch, or MIDI"
      />
    );
  }

  const noteNames = theories.map((theory) => theory.displayName).join(" · ");

  if (theories.length === 1) {
    const [theory] = theories as [NoteTheory];
    return (
      <Readout
        dim={!held}
        lead={<Syllable theory={theory} />}
        title={<span className="font-mono">{theory.displayName}</span>}
        detail={
          theory.isTonic
            ? "Tonic"
            : `Degree ${theory.degreeLabel}${theory.inScale ? "" : " · outside the scale"}`
        }
      />
    );
  }

  const harmony = analyzeHarmony(notes.map((note) => note.midi));
  const syllables = (
    <span className="flex gap-1.5">
      {theories.map((theory, index) => (
        <Syllable key={index} theory={theory} className="text-[13px]" />
      ))}
    </span>
  );

  if (harmony?.kind === "chord") {
    // Spell the chord with the same letters as its keys.
    const letters = new Map(
      notes.map((note) => [
        mod12(note.midi),
        theoryByName.get(note.name)?.letter,
      ]),
    );
    const spell = (pitchClass: number) =>
      letters.get(pitchClass) ?? pitchClassName(pitchClass, flats);
    return (
      <Readout
        dim={!held}
        lead={
          <span className="font-semibold text-white">
            {chordSymbol(harmony, spell)}
          </span>
        }
        title={`${spell(harmony.rootPc)} ${harmony.quality}${
          harmony.inversion ? ` · ${harmony.inversion}` : ""
        }`}
        detail={syllables}
      />
    );
  }

  if (harmony?.kind === "interval") {
    return (
      <Readout
        dim={!held}
        lead={syllables}
        title={harmony.name}
        detail={<span className="font-mono">{noteNames}</span>}
      />
    );
  }

  return (
    <Readout
      dim={!held}
      lead={syllables}
      title={`${theories.length} notes`}
      detail={<span className="font-mono">{noteNames}</span>}
    />
  );
}

function PracticeReadout({
  practice,
  theoryByName,
  playReference,
}: {
  practice: EarTrainingState;
  theoryByName: ReadonlyMap<string, NoteTheory>;
  playReference: boolean;
}) {
  const target = practice.target ? theoryByName.get(practice.target) : null;
  const guess = practice.guess ? theoryByName.get(practice.guess) : null;
  const listening = (
    <Ear size={22} className="animate-display-pulse text-indigo-300" />
  );

  switch (practice.phase) {
    case "prompting":
      return (
        <Readout
          lead={listening}
          title="Listen…"
          detail={
            playReference ? "First Do, then the mystery note" : "Mystery note"
          }
        />
      );
    case "awaiting":
      return (
        <Readout
          lead={<Ear size={22} className="text-indigo-300" />}
          title="Which note was it?"
          detail="Play it back in any octave"
        />
      );
    case "wrong":
      return (
        <Readout
          lead={<X size={22} className="text-red-400" />}
          title={
            <>
              Not quite. You played{" "}
              {guess ? (
                <Syllable theory={guess} className="text-[13px]" />
              ) : (
                "another note"
              )}
            </>
          }
          detail="Try again, replay it, or reveal the answer"
        />
      );
    case "correct":
      return target ? (
        <Readout
          lead={<Syllable theory={target} />}
          title={
            <span className="flex items-center gap-1 text-green-400">
              <Check size={14} strokeWidth={3} /> Correct
            </span>
          }
          detail="Next note coming up…"
        />
      ) : null;
    case "revealed":
      return target ? (
        <Readout
          lead={<Syllable theory={target} />}
          title={`It was ${target.syllable}, ${target.displayName}`}
          detail="Play it to hear it, then go to the next note"
        />
      ) : null;
    default:
      return (
        <Readout
          lead={<Ear size={22} className="text-white/35" />}
          title="Ear training paused"
          detail="Press Next note to continue"
        />
      );
  }
}

export function PianoDisplay({
  activeNotes,
  notesByName,
  theoryByName,
  keyLabel,
  flats,
  loading,
  practice,
  playReference,
}: PianoDisplayProps) {
  const { names, held } = useHeldOrLastNotes(activeNotes);
  const practicing = practice.phase !== "idle";
  const percent = Math.round(loading.progress * 100);

  let content: ReactNode;
  if (loading.error) {
    content = (
      <div role="alert" className="flex min-w-0 items-center gap-3">
        <span className="truncate text-[13px] text-red-300">
          {loading.error}
        </span>
        <button
          type="button"
          onClick={loading.onRetry}
          className="flex shrink-0 items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-white hover:bg-white/20"
        >
          <RotateCcw size={12} /> Retry
        </button>
      </div>
    );
  } else if (loading.isPreloading) {
    content = (
      <Readout
        title="Loading samples…"
        detail={<span className="font-mono">{percent}%</span>}
      />
    );
  } else if (practicing) {
    content = (
      <PracticeReadout
        practice={practice}
        theoryByName={theoryByName}
        playReference={playReference}
      />
    );
  } else {
    content = (
      <NotesReadout
        names={names}
        held={held}
        notesByName={notesByName}
        theoryByName={theoryByName}
        flats={flats}
      />
    );
  }

  return (
    <div className="piano-display">
      {practicing && practice.stats.streak > 1 ? (
        <span className="col-start-1 hidden justify-self-start rounded-md bg-amber-400/15 px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-amber-300 @xs:block">
          Streak {practice.stats.streak}
        </span>
      ) : (
        <span className="col-start-1 hidden justify-self-start rounded-md bg-white/6 px-2 py-1 text-[11px] font-medium whitespace-nowrap text-white/60 @sm:block">
          <span className="mr-1.5 text-[10px] font-semibold tracking-wider text-white/35 uppercase">
            Key
          </span>
          {keyLabel}
        </span>
      )}

      <div
        className="col-start-2 min-w-0"
        aria-live={practicing || loading.error ? "polite" : "off"}
      >
        {content}
      </div>

      {loading.isPreloading && !loading.error && (
        <div
          className="absolute inset-x-0 bottom-0 h-0.5 bg-white/5"
          role="progressbar"
          aria-label="Loading samples"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-indigo-400 transition-[width] duration-150 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
