import { describe, expect, it } from "vitest";
import {
  IDLE_STATE,
  answer,
  beginRound,
  isRoundOpen,
  pickTarget,
  reveal,
  type EarTrainingState,
} from "./earTraining";

const G3 = 55;
const G4 = 67;
const A3 = 57;

function started(target = "G3"): EarTrainingState {
  return beginRound({ ...IDLE_STATE, phase: "ready" }, target);
}

describe("pickTarget", () => {
  it("never repeats the previous target when another is available", () => {
    const candidates = ["C3", "D3"];
    for (let i = 0; i < 20; i++) {
      expect(pickTarget(candidates, "C3", Math.random)).toBe("D3");
    }
  });

  it("can repeat when there is only one choice", () => {
    expect(pickTarget(["C3"], "C3")).toBe("C3");
    expect(pickTarget([], null)).toBeNull();
  });
});

describe("ear training rounds", () => {
  it("accepts the right pitch in any octave on the first try", () => {
    const state = answer(started(), "G4", G4, G3);

    expect(state.phase).toBe("correct");
    expect(state.stats).toEqual({ rounds: 1, firstTry: 1, streak: 1, best: 1 });
    expect(isRoundOpen(state)).toBe(false);
  });

  it("lets you retry after a wrong answer without scoring it", () => {
    const wrong = answer(started(), "A3", A3, G3);
    expect(wrong).toMatchObject({ phase: "wrong", guess: "A3", missed: true });
    expect(isRoundOpen(wrong)).toBe(true);

    const right = answer(wrong, "G3", G3, G3);
    expect(right.phase).toBe("correct");
    expect(right.stats).toMatchObject({ rounds: 1, firstTry: 0, streak: 0 });
  });

  it("counts attempts so the same wrong key can flash again", () => {
    const once = answer(started(), "A3", A3, G3);
    const twice = answer(once, "A3", A3, G3);
    expect(twice.attempt).toBe(once.attempt + 1);
  });

  it("tracks the best streak across rounds", () => {
    let state = answer(started("G3"), "G3", G3, G3);
    state = answer(beginRound(state, "A3"), "A3", A3, A3);
    state = answer(beginRound(state, "G3"), "A3", A3, G3);

    expect(state.stats).toMatchObject({ streak: 0, best: 2 });
  });

  it("ends the round and the streak when the answer is revealed", () => {
    const previous = answer(started(), "G3", G3, G3);
    const revealed = reveal(beginRound(previous, "A3"));

    expect(revealed.phase).toBe("revealed");
    expect(revealed.stats).toMatchObject({ rounds: 2, streak: 0, best: 1 });
    expect(reveal(revealed)).toBe(revealed);
  });

  it("counts skipping an unanswered round as a miss", () => {
    const skipped = beginRound(started("G3"), "A3");
    expect(skipped.stats).toMatchObject({ rounds: 1, firstTry: 0 });
    expect(skipped).toMatchObject({ phase: "prompting", target: "A3" });
  });

  it("ignores answers when no round is open", () => {
    expect(answer(IDLE_STATE, "G3", G3, G3)).toBe(IDLE_STATE);
  });
});
