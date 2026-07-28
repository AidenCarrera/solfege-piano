"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings2,
  Waves,
  ChevronsUpDown,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getGlassPanelColor } from "@/lib/colorUtils";
import type { EffectNode } from "@/lib/effects";
import { SHORT_SCREEN_QUERY, type SoundType } from "@/lib/config";
import { SettingsTab } from "./SettingsTab";
import { EffectsTab } from "./EffectsTab";

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
  /** True while the zoom is following the fit measurement rather than a choice. */
  autoScale: boolean;
  setPianoScale: (v: number | null) => void;
  bgColor: string;
  setBgColor: (v: string) => void;
  soundType: SoundType;
  setSoundType: (s: SoundType) => void;
  startOctave: number;
  endOctave: number;
  onOctaveChange: (start: number, end: number) => void;
  onResetSettings: () => void;
  textColor: string;
}

/** Collapsible panel holding the settings and effects tabs. */
function ControlPanelComponent({
  volume,
  setVolume,
  effectChain,
  setEffectChain,
  labelsEnabled,
  setLabelsEnabled,
  solfegeEnabled,
  setSolfegeEnabled,
  pianoScale,
  autoScale,
  setPianoScale,
  bgColor,
  setBgColor,
  soundType,
  setSoundType,
  startOctave,
  endOctave,
  onOctaveChange,
  onResetSettings,
  textColor,
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "effects">(
    "settings",
  );
  // On a phone the keyboard has the screen below to itself, so the panel
  // starts collapsed and the first screen is not all controls. `null` means
  // "follow the viewport"; a toggle is an explicit choice and wins from then
  // on, the same convention the stored zoom uses.
  const [collapseOverride, setCollapseOverride] = useState<boolean | null>(
    null,
  );
  const isShortScreen = useMediaQuery(SHORT_SCREEN_QUERY);
  const isCollapsed = collapseOverride ?? isShortScreen;

  const panelBg = useMemo(() => getGlassPanelColor(bgColor), [bgColor]);
  const borderColor =
    textColor === "#ffffff" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const usesLightText = textColor === "#ffffff";
  const panelTheme = {
    "--panel-fg": textColor,
    "--panel-surface": usesLightText
      ? "rgba(255,255,255,0.08)"
      : "rgba(0,0,0,0.08)",
    "--panel-surface-hover": usesLightText
      ? "rgba(255,255,255,0.14)"
      : "rgba(0,0,0,0.14)",
  } as React.CSSProperties;

  return (
    <div
      className="glass-panel w-full max-w-4xl shrink-0 overflow-hidden rounded-2xl"
      style={{
        backgroundColor: panelBg,
        borderColor,
        color: textColor,
        ...panelTheme,
      }}
    >
      <div
        className="flex border-b relative items-center"
        style={{ borderColor }}
      >
        {(["settings", "effects"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setCollapseOverride(false);
            }}
            className="relative flex cursor-pointer items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap transition-colors duration-150 sm:gap-2 sm:px-6 sm:py-3.5 sm:text-sm"
            style={{
              color: activeTab === tab ? "rgb(129,140,248)" : "var(--panel-fg)",
            }}
          >
            {tab === "effects" ? <Waves size={14} /> : <Settings2 size={14} />}
            {tab === "effects" ? (
              <span>
                Effects<span className="hidden sm:inline"> Chain</span>
              </span>
            ) : (
              "Settings"
            )}
            {activeTab === tab && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
              />
            )}
          </button>
        ))}

        <div className="ml-auto mr-2 flex items-center gap-1.5 sm:mr-3 sm:gap-2">
          {activeTab === "settings" && !isCollapsed && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              type="button"
              onClick={onResetSettings}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors sm:px-2.5 sm:py-1 sm:text-xs"
              style={{
                color: "var(--panel-fg)",
                background: "var(--panel-surface)",
              }}
              whileHover={{
                background: "var(--panel-surface-hover)",
              }}
              whileTap={{ scale: 0.95 }}
              title="Restore default settings. Your effects chain is kept."
              aria-label="Reset settings"
            >
              <RotateCcw size={12} />
              {/* The icon carries this on narrow screens, where the tab row
                  has no room to spare. */}
              <span className="hidden sm:inline">Reset settings</span>
            </motion.button>
          )}

          {activeTab === "effects" &&
            !isCollapsed &&
            effectChain.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                type="button"
                onClick={() => setEffectChain([])}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-2 py-1.5 text-[11px] font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300 sm:px-2.5 sm:py-1 sm:text-xs"
                whileTap={{ scale: 0.95 }}
                title="Remove all effects from the chain"
                aria-label="Clear all effects"
              >
                <Trash2 size={12} />
                <span className="hidden sm:inline">Clear All</span>
              </motion.button>
            )}

          <motion.button
            onClick={() => setCollapseOverride(!isCollapsed)}
            className="p-1.5 rounded-lg cursor-pointer"
            style={{
              color: "var(--panel-fg)",
              background: "var(--panel-surface)",
            }}
            whileHover={{
              color: "var(--panel-fg)",
              background: "var(--panel-surface-hover)",
            }}
            whileTap={{ scale: 0.9 }}
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            title={isCollapsed ? "Expand panel" : "Collapse panel"}
            aria-label={
              isCollapsed ? "Expand control panel" : "Collapse control panel"
            }
            aria-expanded={!isCollapsed}
          >
            <ChevronsUpDown size={15} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="panel-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            style={{ overflow: "hidden" }}
          >
            <AnimatePresence mode="wait">
              {activeTab === "effects" && (
                <EffectsTab
                  effectChain={effectChain}
                  setEffectChain={setEffectChain}
                  borderColor={borderColor}
                />
              )}

              {activeTab === "settings" && (
                <SettingsTab
                  volume={volume}
                  setVolume={setVolume}
                  soundType={soundType}
                  setSoundType={setSoundType}
                  startOctave={startOctave}
                  endOctave={endOctave}
                  onOctaveChange={onOctaveChange}
                  pianoScale={pianoScale}
                  autoScale={autoScale}
                  setPianoScale={setPianoScale}
                  bgColor={bgColor}
                  setBgColor={setBgColor}
                  labelsEnabled={labelsEnabled}
                  setLabelsEnabled={setLabelsEnabled}
                  solfegeEnabled={solfegeEnabled}
                  setSolfegeEnabled={setSolfegeEnabled}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Memoized to prevent re-rendering panel on every note press. */
export const ControlPanel = React.memo(ControlPanelComponent);
