import type { LucideIcon } from "lucide-react";
import { Waves, Zap, Gauge, Music, Clock, Wind } from "lucide-react";
import type { EffectType } from "@/lib/effects";

/**
 * Branding for each effect: the rack renders add-buttons, cards, and the drag
 * ghost from this table, so an effect looks the same everywhere it appears.
 *
 * Icons are stored as components rather than rendered elements so each call
 * site can size them for its own context.
 */
export interface EffectMeta {
  Icon: LucideIcon;
  /** Tailwind gradient stops, applied with `bg-linear-to-*`. */
  color: string;
  /** Matching shadow colour for hover and drag states. */
  glow: string;
  description: string;
}

/** Declaration order sets the order of the "Add Effect" buttons. */
export const EFFECT_META: Record<EffectType, EffectMeta> = {
  Distortion: {
    Icon: Waves,
    color: "from-red-500 to-rose-600",
    glow: "rgba(239,68,68,0.5)",
    description: "Drive & crush",
  },
  Filter: {
    Icon: Zap,
    color: "from-orange-500 to-amber-500",
    glow: "rgba(249,115,22,0.5)",
    description: "Frequency shaping",
  },
  Compressor: {
    Icon: Gauge,
    color: "from-yellow-500 to-amber-400",
    glow: "rgba(234,179,8,0.5)",
    description: "Dynamic control",
  },
  Modulation: {
    Icon: Music,
    color: "from-emerald-500 to-teal-500",
    glow: "rgba(16,185,129,0.5)",
    description: "Movement & width",
  },
  Delay: {
    Icon: Clock,
    color: "from-blue-500 to-cyan-500",
    glow: "rgba(59,130,246,0.5)",
    description: "Echo repeat",
  },
  Reverb: {
    Icon: Wind,
    color: "from-violet-500 to-purple-600",
    glow: "rgba(139,92,246,0.5)",
    description: "Room ambience",
  },
};

/** Size used for the icon wherever an effect is represented in the rack. */
export const EFFECT_ICON_SIZE = 14;

// Card width lives in CSS, as `.effect-card` in globals.css: it narrows on
// small screens, which a module constant could not do, and both the real card
// and the drag ghost wear the class so the ghost stays a true preview.
