"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, Waves, ChevronsUpDown } from "lucide-react";
import { getGlassPanelColor } from "@/lib/colorUtils";
import { ControlPanelProps } from "./ControlPanelTypes";
import { SettingsTab } from "./SettingsTab";
import { EffectsTab } from "./EffectsTab";

export default function ControlPanel({
  volume,
  setVolume,
  effectChain,
  setEffectChain,
  labelsEnabled,
  setLabelsEnabled,
  solfegeEnabled,
  setSolfegeEnabled,
  pianoScale,
  setPianoScale,
  bgColor,
  setBgColor,
  soundType,
  setSoundType,
  startOctave,
  endOctave,
  onOctaveChange,
  textColor,
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "effects">(
    "settings",
  );
  const [isCollapsed, setIsCollapsed] = useState(false);

  const panelBg = useMemo(() => getGlassPanelColor(bgColor), [bgColor]);
  const borderColor =
    textColor === "#ffffff" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const usesLightText = textColor === "#ffffff";
  const panelTheme = {
    "--panel-fg": textColor,
    "--panel-muted": textColor,
    "--panel-subtle": textColor,
    "--panel-surface": usesLightText
      ? "rgba(255,255,255,0.08)"
      : "rgba(0,0,0,0.08)",
    "--panel-surface-hover": usesLightText
      ? "rgba(255,255,255,0.14)"
      : "rgba(0,0,0,0.14)",
  } as React.CSSProperties;

  return (
    <div
      className="glass-panel rounded-2xl mb-4 w-full max-w-4xl overflow-hidden"
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
              setIsCollapsed(false);
            }}
            className="relative flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-colors duration-150 cursor-pointer"
            style={{
              color:
                activeTab === tab ? "rgb(129,140,248)" : "var(--panel-muted)",
            }}
          >
            {tab === "effects" ? <Waves size={14} /> : <Settings2 size={14} />}
            {tab === "effects" ? "Effects Chain" : "Settings"}
            {activeTab === tab && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full"
              />
            )}
          </button>
        ))}

        <motion.button
          onClick={() => setIsCollapsed((c) => !c)}
          className="ml-auto mr-3 p-1.5 rounded-lg cursor-pointer"
          style={{
            color: "var(--panel-muted)",
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
