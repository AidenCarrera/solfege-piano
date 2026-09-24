"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Note } from "@/lib/note";
import {
  IDLE_STATE,
  EMPTY_STATS,
  answer,
  beginRound,
  isRoundOpen,
  pickTarget,
  reveal as revealState,
  type EarTrainingState,
} from "@/lib/earTraining";

const REFERENCE_MS = 650;
const GAP_MS = 250;
const TARGET_MS = 1000;
const NEXT_ROUND_DELAY_MS = 1100;

export type KeyFeedback = "correct" | "wrong" | "reveal";

export interface EarTrainingOptions {
  /** Notes that can be asked. */
  candidates: readonly Note[];
  /** Every note on the keyboard, for resolving answers. */
  notes: readonly Note[];
  /** Pitch class of Do. */
  tonic: number;
  playReference: boolean;
  playNote: (noteName: string) => void;
  releaseNotes: (noteNames: readonly string[]) => void;
}

// Play Do from the octave nearest the target so the reference stays in range.
function nearestTonic(
  notes: readonly Note[],
  target: Note,
  tonic: number,
): Note | null {
  let nearest: Note | null = null;
  for (const note of notes) {
    if (note.midi % 12 !== tonic) continue;
    const distance = Math.abs(note.midi - target.midi);
    if (!nearest || distance < Math.abs(nearest.midi - target.midi)) {
      nearest = note;
    }
  }
  return nearest;
}

export function useEarTraining(options: EarTrainingOptions) {
  const [state, setState] = useState<EarTrainingState>(IDLE_STATE);
  // Event handlers read the latest state before React re-renders.
  const stateRef = useRef(state);
  const timersRef = useRef<number[]>([]);

  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  const commit = useCallback(
    (update: (previous: EarTrainingState) => EarTrainingState) => {
      const next = update(stateRef.current);
      if (next === stateRef.current) return;
      stateRef.current = next;
      setState(next);
    },
    [],
  );

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((callback: () => void, delay: number) => {
    timersRef.current.push(window.setTimeout(callback, delay));
  }, []);

  const playPrompt = useCallback(
    (targetName: string) => {
      clearTimers();
      const { notes, tonic, playReference, playNote, releaseNotes } =
        latest.current;
      const target = notes.find((note) => note.name === targetName);
      if (!target) return;

      let start = 0;
      const reference = playReference
        ? nearestTonic(notes, target, tonic)
        : null;
      if (reference) {
        schedule(() => playNote(reference.name), start);
        schedule(() => releaseNotes([reference.name]), start + REFERENCE_MS);
        start += REFERENCE_MS + GAP_MS;
      }

      schedule(() => playNote(target.name), start);
      schedule(() => {
        latest.current.releaseNotes([target.name]);
        commit((previous) =>
          previous.phase === "prompting"
            ? { ...previous, phase: "awaiting" }
            : previous,
        );
      }, start + TARGET_MS);
    },
    [clearTimers, commit, schedule],
  );

  const nextRound = useCallback(() => {
    const names = latest.current.candidates.map((note) => note.name);
    const target = pickTarget(names, stateRef.current.target);
    if (!target) return;
    commit((previous) => beginRound(previous, target));
    playPrompt(target);
  }, [commit, playPrompt]);

  const start = useCallback(() => {
    commit(() => ({ ...IDLE_STATE, phase: "ready", stats: EMPTY_STATS }));
    nextRound();
  }, [commit, nextRound]);

  const stop = useCallback(() => {
    clearTimers();
    commit(() => IDLE_STATE);
  }, [clearTimers, commit]);

  const replay = useCallback(() => {
    const { target } = stateRef.current;
    if (!target) return;
    commit((previous) =>
      isRoundOpen(previous) ? { ...previous, phase: "prompting" } : previous,
    );
    playPrompt(target);
  }, [commit, playPrompt]);

  const reveal = useCallback(() => {
    clearTimers();
    commit(revealState);
  }, [clearTimers, commit]);

  /** Pauses the round when the keyboard, key, or sound changes. */
  const reset = useCallback(() => {
    clearTimers();
    commit((previous) =>
      previous.phase === "idle"
        ? previous
        : { ...previous, phase: "ready", target: null, guess: null },
    );
  }, [clearTimers, commit]);

  const handleNote = useCallback(
    (noteName: string) => {
      const current = stateRef.current;
      if (!isRoundOpen(current)) return;

      const { notes } = latest.current;
      const guess = notes.find((note) => note.name === noteName);
      const target = notes.find((note) => note.name === current.target);
      if (!guess || !target) return;

      commit((previous) =>
        answer(previous, guess.name, guess.midi, target.midi),
      );
      if (stateRef.current.phase === "correct") {
        clearTimers();
        schedule(nextRound, NEXT_ROUND_DELAY_MS);
      }
    },
    [clearTimers, commit, nextRound, schedule],
  );

  useEffect(() => clearTimers, [clearTimers]);

  const keyFeedback = useMemo(() => {
    const feedback = new Map<string, KeyFeedback>();
    if (state.phase === "correct" && state.guess) {
      feedback.set(state.guess, "correct");
    } else if (state.phase === "wrong" && state.guess) {
      feedback.set(state.guess, "wrong");
    } else if (state.phase === "revealed" && state.target) {
      feedback.set(state.target, "reveal");
    }
    return feedback;
  }, [state.phase, state.guess, state.target]);

  return {
    state,
    keyFeedback,
    start,
    stop,
    replay,
    reveal,
    next: nextRound,
    reset,
    handleNote,
  };
}

export type EarTraining = ReturnType<typeof useEarTraining>;
