"use client";

import { useEffect, useRef } from "react";
import { CircleHelp, X } from "lucide-react";
import {
  BASE_NOTES,
  HIGHER_KEYBOARD_MAP,
  LOWER_KEYBOARD_MAP,
} from "@/lib/note";
import { isTextEntryTarget } from "@/lib/keyboard";
import { analyzeNote, degreeColor, type TheoryContext } from "@/lib/theory";
import { IconButton } from "@/components/ui/controls";

interface Keycap {
  shortcut: string;
  midi: number;
}

interface KeycapRows {
  whites: Keycap[];
  /** Black keys, indexed by the white key they follow. */
  blacks: (Keycap | null)[];
}

function keycapRows(map: readonly string[], startOctave: number): KeycapRows {
  const whites: Keycap[] = [];
  const blacks: (Keycap | null)[] = [];

  map.forEach((shortcut, index) => {
    const pitchClass = index % BASE_NOTES.length;
    const midi = (startOctave + 1) * BASE_NOTES.length + index;
    if (BASE_NOTES[pitchClass]!.isSharp) {
      blacks[whites.length - 1] = { shortcut, midi };
    } else {
      whites.push({ shortcut, midi });
    }
  });

  return {
    whites,
    blacks: whites.slice(0, -1).map((_, index) => blacks[index] ?? null),
  };
}

const UPPER_ROWS = keycapRows(HIGHER_KEYBOARD_MAP, 4);
const LOWER_ROWS = keycapRows(LOWER_KEYBOARD_MAP, 3);

function Cap({
  cap,
  context,
  black,
}: {
  cap: Keycap;
  context: TheoryContext;
  black?: boolean;
}) {
  const theory = analyzeNote(cap.midi, context);
  return (
    <div
      className={`flex h-12 w-9 shrink-0 flex-col items-center justify-center rounded-md border border-b-[3px] text-center sm:w-10 ${
        black
          ? "border-zinc-950 bg-zinc-800 text-white"
          : "border-zinc-300 bg-white text-zinc-800"
      }`}
    >
      <span className="font-mono text-[13px] leading-none font-semibold">
        {cap.shortcut.toUpperCase()}
      </span>
      <span
        className="mt-1 text-[10px] leading-none font-semibold"
        style={{
          color: theory.colored ? degreeColor(theory.degree) : undefined,
        }}
      >
        {theory.syllable}
      </span>
      <span
        className={`mt-0.5 text-[9px] leading-none ${black ? "text-white/55" : "text-zinc-500"}`}
      >
        {theory.displayName}
      </span>
    </div>
  );
}

function KeycapMap({
  rows,
  context,
  label,
}: {
  rows: KeycapRows;
  context: TheoryContext;
  label: string;
}) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-xs font-medium text-ui-muted">
        {label}
      </figcaption>
      <div className="overflow-x-auto pb-1">
        <div className="flex w-max flex-col gap-1">
          {/* Offset by half a key so black keys sit between white keys. */}
          <div className="flex gap-1 pl-[1.25rem] sm:pl-[1.375rem]">
            {rows.blacks.map((cap, index) =>
              cap ? (
                <Cap key={cap.shortcut} cap={cap} context={context} black />
              ) : (
                <div key={`gap-${index}`} className="w-9 shrink-0 sm:w-10" />
              ),
            )}
          </div>
          <div className="flex gap-1">
            {rows.whites.map((cap) => (
              <Cap key={cap.shortcut} cap={cap} context={context} />
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}

function Shortcut({ keys, children }: { keys: string[]; children: string }) {
  return (
    <li className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-ui-muted">{children}</span>
      <span className="flex gap-1">
        {keys.map((key) => (
          <kbd key={key} className="kbd">
            {key}
          </kbd>
        ))}
      </span>
    </li>
  );
}

function toggleDialog(dialog: HTMLDialogElement | null) {
  if (!dialog) return;
  if (dialog.open) dialog.close();
  else dialog.showModal();
}

export function HelpDialog({ context }: { context: TheoryContext }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toggle = () => toggleDialog(dialogRef.current);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "?" || e.repeat || isTextEntryTarget(e.target)) return;
      e.preventDefault();
      toggleDialog(dialogRef.current);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <IconButton label="Help and keyboard shortcuts" onClick={toggle}>
        <CircleHelp size={18} />
      </IconButton>

      <dialog
        ref={dialogRef}
        aria-labelledby="help-title"
        onClick={(e) => {
          // Clicks on the backdrop land on the dialog element itself.
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto max-h-[92svh] w-[min(46rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-ui-border bg-ui-elevated p-0 text-ui-fg shadow-2xl backdrop:bg-black/55 backdrop:backdrop-blur-sm"
      >
        <div className="flex max-h-[92svh] flex-col">
          <header className="flex items-center justify-between border-b border-ui-border px-5 py-3.5">
            <h2 id="help-title" className="text-base font-semibold">
              How to play
            </h2>
            <IconButton
              label="Close"
              onClick={() => dialogRef.current?.close()}
              className="-mr-2"
            >
              <X size={18} />
            </IconButton>
          </header>

          <div className="flex flex-col gap-6 overflow-y-auto px-5 py-5 text-sm leading-relaxed">
            <section className="flex flex-col gap-3">
              <h3 className="font-semibold">Computer keyboard</h3>
              <KeycapMap
                rows={LOWER_ROWS}
                context={context}
                label="Bottom rows: C3 to F4"
              />
              <KeycapMap
                rows={UPPER_ROWS}
                context={context}
                label="Top rows: C4 to G5"
              />
              <p className="text-xs text-ui-subtle">
                Keys outside the octave range you choose in Settings stay
                silent.
              </p>
            </section>

            <section className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-1 font-semibold">Shortcuts</h3>
                <ul className="divide-y divide-ui-border">
                  <Shortcut keys={["Space"]}>Sustain on or off</Shortcut>
                  <Shortcut keys={["?"]}>Show this help</Shortcut>
                  <Shortcut keys={["Esc"]}>Close this help</Shortcut>
                </ul>
              </div>
              <div>
                <h3 className="mb-1 font-semibold">Mouse, touch & MIDI</h3>
                <p className="text-ui-muted">
                  Drag across the keys for a glissando, or use several fingers
                  for chords. To use a MIDI keyboard, choose Connect in
                  Settings. Key velocity and the sustain pedal both work.
                </p>
              </div>
            </section>

            <section>
              <h3 className="mb-1 font-semibold">Solfege in any key</h3>
              <p className="text-ui-muted">
                Pick a key and scale at the top. The syllables are movable do,
                so the key&rsquo;s tonic is always <strong>Do</strong>. Each
                syllable keeps its color in every key. Minor scales use do-based
                minor: Do Re Me Fa Sol Le Te. Notes outside the scale use their
                usual chromatic names, such as Fi and Te. Dots mark the notes of
                the scale, and the ringed dot is Do. Choose None as the scale to
                turn the colors and dots off.
              </p>
              <p className="mt-2 text-ui-muted">
                The Solfege voice was recorded in C, so the key stays on C while
                it plays.
              </p>
            </section>

            <section>
              <h3 className="mb-1 font-semibold">Ear training</h3>
              <p className="text-ui-muted">
                The Ear Training tab plays Do and then a mystery note from your
                scale. Play the note back in any octave. The display tells you
                how you did and keeps count of your streak.
              </p>
            </section>
          </div>
        </div>
      </dialog>
    </>
  );
}
