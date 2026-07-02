import React from "react";
import { Waves, Zap, Gauge, Music, Clock, Wind } from "lucide-react";
import { EffectNode, EffectType } from "@/lib/effects";
import { SoundType } from "@/lib/config";

export const OCTAVE_MAP: Record<number, [number, number]> = {
  1: [3, 4],
  2: [3, 5],
  3: [2, 5],
  4: [2, 6],
};

export const EFFECT_META: Record<
  EffectType,
  { icon: React.ReactNode; color: string; glow: string; description: string }
> = {
  Distortion: {
    icon: <Waves size={14} />,
    color: "from-red-500 to-rose-600",
    glow: "rgba(239,68,68,0.5)",
    description: "Drive & crush",
  },
  Filter: {
    icon: <Zap size={14} />,
    color: "from-orange-500 to-amber-500",
    glow: "rgba(249,115,22,0.5)",
    description: "Frequency shaping",
  },
  Compressor: {
    icon: <Gauge size={14} />,
    color: "from-yellow-500 to-amber-400",
    glow: "rgba(234,179,8,0.5)",
    description: "Dynamic control",
  },
  Modulation: {
    icon: <Music size={14} />,
    color: "from-emerald-500 to-teal-500",
    glow: "rgba(16,185,129,0.5)",
    description: "Movement & width",
  },
  Delay: {
    icon: <Clock size={14} />,
    color: "from-blue-500 to-cyan-500",
    glow: "rgba(59,130,246,0.5)",
    description: "Echo repeat",
  },
  Reverb: {
    icon: <Wind size={14} />,
    color: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.5)",
    description: "Room ambience",
  },
};

export interface ControlPanelProps {
  volume: number;
  setVolume: (v: number) => void;
  effectChain: EffectNode[];
  setEffectChain: React.Dispatch<React.SetStateAction<EffectNode[]>>;
  labelsEnabled: boolean;
  setLabelsEnabled: (b: boolean) => void;
  solfegeEnabled: boolean;
  setSolfegeEnabled: (b: boolean) => void;
  pianoScale: number;
  setPianoScale: (v: number) => void;
  bgColor: string;
  setBgColor: (v: string) => void;
  soundType: SoundType;
  setSoundType: (s: SoundType) => void;
  startOctave: number;
  endOctave: number;
  onOctaveChange: (start: number, end: number) => void;
  textColor: string;
}
