import type { LucideIcon } from "lucide-react";
import { Waves, Zap, Gauge, Music, Clock, Wind } from "lucide-react";
import type { EffectType } from "@/lib/effects";

export interface EffectMeta {
  Icon: LucideIcon;
  color: string;
  glow: string;
}

// Declaration order controls the effect palette.
export const EFFECT_META: Record<EffectType, EffectMeta> = {
  Distortion: {
    Icon: Waves,
    color: "from-red-500 to-rose-600",
    glow: "rgba(239,68,68,0.5)",
  },
  Filter: {
    Icon: Zap,
    color: "from-orange-500 to-amber-500",
    glow: "rgba(249,115,22,0.5)",
  },
  Compressor: {
    Icon: Gauge,
    color: "from-yellow-500 to-amber-400",
    glow: "rgba(234,179,8,0.5)",
  },
  Modulation: {
    Icon: Music,
    color: "from-emerald-500 to-teal-500",
    glow: "rgba(16,185,129,0.5)",
  },
  Delay: {
    Icon: Clock,
    color: "from-blue-500 to-cyan-500",
    glow: "rgba(59,130,246,0.5)",
  },
  Reverb: {
    Icon: Wind,
    color: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.5)",
  },
};

export const EFFECT_ICON_SIZE = 14;
