import { mod12 } from "./theory";

export type EarTrainingPhase =
  | "idle"
  | "ready"
  | "prompting"
  | "awaiting"
  | "wrong"
  | "correct"
  | "revealed";

export interface EarTrainingStats {
  /** Rounds that ended by answering, revealing, or skipping. */
  rounds: number;
  /** Rounds answered correctly without a wrong guess. */
  firstTry: number;
  streak: number;
  best: number;
}

export interface EarTrainingState {
  phase: EarTrainingPhase;
  target: string | null;
  /** The most recent answer, used for key feedback. */
  guess: string | null;
  /** Increments per answer so repeated feedback on one key replays. */
  attempt: number;
  missed: boolean;
  stats: EarTrainingStats;
}

export const EMPTY_STATS: EarTrainingStats = {
  rounds: 0,
  firstTry: 0,
  streak: 0,
  best: 0,
};

export const IDLE_STATE: EarTrainingState = {
  phase: "idle",
  target: null,
  guess: null,
  attempt: 0,
  missed: false,
  stats: EMPTY_STATS,
};

export function isActive(state: EarTrainingState): boolean {
  return state.phase !== "idle";
}

/** A round is open while its answer has not been given or revealed. */
export function isRoundOpen(state: EarTrainingState): boolean {
  return (
    state.target !== null &&
    (state.phase === "prompting" ||
      state.phase === "awaiting" ||
      state.phase === "wrong")
  );
}

export function pickTarget<T>(
  candidates: readonly T[],
  previous: T | null,
  random: () => number = Math.random,
): T | null {
  if (candidates.length === 0) return null;
  // Avoid asking the same note twice in a row when there is a choice.
  const pool =
    candidates.length > 1 && previous !== null
      ? candidates.filter((candidate) => candidate !== previous)
      : candidates;
  return pool[Math.floor(random() * pool.length)] ?? null;
}

export function beginRound(
  state: EarTrainingState,
  target: string,
): EarTrainingState {
  // Leaving an unanswered round counts as a miss.
  const stats = isRoundOpen(state)
    ? { ...state.stats, rounds: state.stats.rounds + 1, streak: 0 }
    : state.stats;
  return {
    ...state,
    phase: "prompting",
    target,
    guess: null,
    missed: false,
    stats,
  };
}

/** Answers compare pitch class, so any octave counts. */
export function answer(
  state: EarTrainingState,
  guess: string,
  guessMidi: number,
  targetMidi: number,
): EarTrainingState {
  if (!isRoundOpen(state)) return state;

  const attempt = state.attempt + 1;
  if (mod12(guessMidi) !== mod12(targetMidi)) {
    return {
      ...state,
      phase: "wrong",
      guess,
      attempt,
      missed: true,
      stats: { ...state.stats, streak: 0 },
    };
  }

  const firstTry = !state.missed;
  const streak = firstTry ? state.stats.streak + 1 : 0;
  return {
    ...state,
    phase: "correct",
    guess,
    attempt,
    stats: {
      rounds: state.stats.rounds + 1,
      firstTry: state.stats.firstTry + (firstTry ? 1 : 0),
      streak,
      best: Math.max(state.stats.best, streak),
    },
  };
}

export function reveal(state: EarTrainingState): EarTrainingState {
  if (!isRoundOpen(state)) return state;
  return {
    ...state,
    phase: "revealed",
    guess: null,
    stats: { ...state.stats, rounds: state.stats.rounds + 1, streak: 0 },
  };
}
