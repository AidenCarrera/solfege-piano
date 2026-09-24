"use client";
import React from "react";
import type { Note } from "@/lib/note";
import type { NoteTheory } from "@/lib/theory";
import type { KeyFeedback } from "./hooks/useEarTraining";

type PianoKeyProps = {
  note: Note;
  theory: NoteTheory;
  isActive: boolean;
  leftRem: number;
  onMouseDown: (noteName: string) => void;
  onMouseEnter: (noteName: string) => void;
  onMouseUp: () => void;
  showShortcut: boolean;
  showSolfege: boolean;
  showNoteName: boolean;
  /** Mark every scale tone, not just Do. */
  showScale: boolean;
  feedback?: KeyFeedback;
  /** Changes per answer so the same feedback can replay. */
  feedbackToken?: number;
};

const BASE_WHITE = "piano-key piano-key-white relative h-64 w-16";
const BASE_BLACK =
  "piano-key piano-key-black absolute -top-px z-20 -mx-5 h-40 w-10";

function PianoKeyComponent({
  note,
  theory,
  isActive,
  leftRem,
  onMouseDown,
  onMouseEnter,
  onMouseUp,
  showShortcut,
  showSolfege,
  showNoteName,
  showScale,
  feedback,
  feedbackToken,
}: PianoKeyProps) {
  const black = note.isSharp;
  const showDot = theory.isTonic || (showScale && theory.inScale);
  // Only Cs carry the octave, like the labels on a real keyboard.
  const noteName = theory.letter === "C" ? theory.displayName : theory.letter;
  const dim = showScale && !theory.inScale;

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown(note.name);
      }}
      onMouseEnter={() => onMouseEnter(note.name)}
      onMouseUp={onMouseUp}
      onBlur={onMouseUp}
      className={`${black ? BASE_BLACK : BASE_WHITE} ${isActive ? "is-active" : ""} transform-gpu`}
      style={
        {
          "--deg-h": theory.hue,
          ...(black ? { left: `${leftRem}rem` } : {}),
        } as React.CSSProperties
      }
      data-note-name={note.name}
      // Keyboard shortcuts avoid a tab stop for every piano key.
      tabIndex={-1}
      aria-label={`${note.spokenName}, ${theory.syllable}${
        note.shortcuts.length > 0
          ? `, shortcuts ${note.shortcuts
              .map((shortcut) => shortcut.toUpperCase())
              .join(" or ")}`
          : ""
      }`}
      aria-pressed={isActive}
    >
      <span
        className={`pointer-events-none absolute inset-x-0 flex flex-col items-center ${
          black ? "bottom-3 gap-1" : "bottom-4 gap-1.5"
        }`}
      >
        {showDot && (
          <span
            className={`scale-dot ${theory.isTonic ? "is-tonic" : ""} ${black ? "mb-0.5" : "mb-1"}`}
          />
        )}

        {showSolfege && (
          <span
            className={`leading-none font-semibold transition-opacity ${
              black ? "text-[11px] text-white/90" : "text-[15px] text-zinc-800"
            } ${dim ? "opacity-45" : ""}`}
          >
            {theory.syllable}
          </span>
        )}

        {showNoteName && (
          <span
            className={`leading-none font-medium ${
              black ? "text-[9px] text-white/55" : "text-[11px] text-zinc-500"
            } ${dim ? "opacity-60" : ""}`}
          >
            {noteName}
          </span>
        )}

        {showShortcut && note.shortcut && (
          <span
            className={`shortcut-cap mt-0.5 border ${
              black
                ? "border-white/15 text-white/60"
                : "border-zinc-300 bg-black/[0.03] text-zinc-500"
            }`}
          >
            {note.shortcut.toUpperCase()}
          </span>
        )}
      </span>

      {feedback && (
        <span
          key={`${feedback}-${feedbackToken ?? 0}`}
          aria-hidden="true"
          className={`key-flash key-flash-${feedback}`}
        />
      )}
    </button>
  );
}

export const PianoKey = React.memo(PianoKeyComponent);
