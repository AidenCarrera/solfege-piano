import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Flame,
  Play,
  RotateCcw,
  SkipForward,
  Square,
  Target,
  Trophy,
} from "lucide-react";
import type { SoundType } from "@/lib/config";
import { isRoundOpen, type EarTrainingState } from "@/lib/earTraining";
import { ToggleChip } from "@/components/ui/controls";

export interface EarTrainingTabProps {
  practice: EarTrainingState;
  ready: boolean;
  keyLabel: string;
  rangeLabel: string;
  candidateCount: number;
  soundType: SoundType;
  playReference: boolean;
  setPlayReference: (value: boolean) => void;
  onStart: () => void;
  onStop: () => void;
  onReplay: () => void;
  onReveal: () => void;
  onNext: () => void;
}

function ActionButton({
  onClick,
  disabled,
  primary = false,
  icon,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "bg-accent-solid text-white shadow-sm hover:brightness-110"
          : "border border-ui-border bg-ui-surface hover:bg-ui-surface-hover"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-ui-surface px-2.5 py-1.5">
      <span className="text-ui-subtle" aria-hidden="true">
        {icon}
      </span>
      <span className="text-[11px] font-semibold tracking-wider text-ui-muted uppercase">
        {label}
      </span>
      <span className="font-mono text-sm font-semibold tabular-nums">
        {value}
      </span>
    </div>
  );
}

export function EarTrainingTab({
  practice,
  ready,
  keyLabel,
  rangeLabel,
  candidateCount,
  soundType,
  playReference,
  setPlayReference,
  onStart,
  onStop,
  onReplay,
  onReveal,
  onNext,
}: EarTrainingTabProps) {
  const active = practice.phase !== "idle";
  const open = isRoundOpen(practice);
  const { stats } = practice;

  return (
    <motion.div
      key="practice"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col gap-4 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        {active ? (
          <>
            <ActionButton
              primary
              onClick={onNext}
              disabled={!ready || candidateCount === 0}
              icon={<SkipForward size={15} />}
            >
              Next note
            </ActionButton>
            <ActionButton
              onClick={onReplay}
              disabled={!ready || practice.target === null}
              icon={<RotateCcw size={15} />}
            >
              Replay
            </ActionButton>
            <ActionButton
              onClick={onReveal}
              disabled={!open}
              icon={<Eye size={15} />}
            >
              Reveal
            </ActionButton>
            <ActionButton onClick={onStop} icon={<Square size={13} />}>
              Stop
            </ActionButton>
          </>
        ) : (
          <ActionButton
            primary
            onClick={onStart}
            disabled={!ready || candidateCount === 0}
            icon={<Play size={15} />}
          >
            Start ear training
          </ActionButton>
        )}

        <div className="ml-auto">
          <ToggleChip
            pressed={playReference}
            onChange={setPlayReference}
            title="Hear the tonic before each mystery note"
          >
            Play Do first
          </ToggleChip>
        </div>
      </div>

      {active && (
        <div className="flex flex-wrap gap-2">
          <Stat
            icon={<Target size={14} />}
            label="Score"
            value={`${stats.firstTry}/${stats.rounds}`}
          />
          <Stat
            icon={<Flame size={14} />}
            label="Streak"
            value={stats.streak}
          />
          <Stat icon={<Trophy size={14} />} label="Best" value={stats.best} />
        </div>
      )}

      <div className="flex flex-col gap-1 text-[13px] leading-relaxed text-ui-muted">
        <p>
          {playReference ? "You’ll hear Do, then" : "You’ll hear"} a note from{" "}
          <strong className="font-semibold text-ui-fg">{keyLabel}</strong>{" "}
          between {rangeLabel} ({candidateCount} notes). Play it back in any
          octave. A first-try answer counts toward your score.
        </p>
        {/* Reserve the warning in both voices so switching doesn't refit the keyboard. */}
        <p
          className={`text-warning ${soundType === "Solfege" ? "" : "invisible"}`}
        >
          The Solfege voice sings each answer. Switch to Piano to test your ear.
        </p>
        {!ready && <p>Samples are still loading…</p>}
      </div>
    </motion.div>
  );
}
