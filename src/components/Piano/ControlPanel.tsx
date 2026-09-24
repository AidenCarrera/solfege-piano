"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronsUpDown,
  Ear,
  RotateCcw,
  Settings2,
  Trash2,
  Waves,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { EffectNode } from "@/lib/effects";
import { SHORT_SCREEN_QUERY } from "@/lib/config";
import { SettingsTab, type SettingsTabProps } from "./SettingsTab";
import { EffectsTab } from "./EffectsTab";
import { EarTrainingTab, type EarTrainingTabProps } from "./EarTrainingTab";

type Tab = "settings" | "effects" | "practice";

const TABS: readonly {
  id: Tab;
  label: string;
  short: string;
  Icon: typeof Ear;
}[] = [
  { id: "settings", label: "Settings", short: "Settings", Icon: Settings2 },
  { id: "effects", label: "Effects Chain", short: "Effects", Icon: Waves },
  { id: "practice", label: "Ear Training", short: "Training", Icon: Ear },
];

export interface ControlPanelProps {
  settingsTab: SettingsTabProps;
  earTrainingTab: EarTrainingTabProps;
  effectChain: EffectNode[];
  setEffectChain: React.Dispatch<React.SetStateAction<EffectNode[]>>;
  onResetSettings: () => void;
}

function ControlPanelComponent({
  settingsTab,
  earTrainingTab,
  effectChain,
  setEffectChain,
  onResetSettings,
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("settings");
  // Follow the viewport until the user explicitly toggles the panel.
  const [collapseOverride, setCollapseOverride] = useState<boolean | null>(
    null,
  );
  const isShortScreen = useMediaQuery(SHORT_SCREEN_QUERY);
  const isCollapsed = collapseOverride ?? isShortScreen;

  return (
    <div className="glass-panel w-full max-w-5xl shrink-0 overflow-hidden rounded-2xl text-ui-fg">
      <div className="flex items-center gap-1 border-b border-ui-border px-1.5">
        <div role="tablist" aria-label="Control panel" className="flex">
          {TABS.map(({ id, label, short, Icon }) => {
            const selected = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={selected && !isCollapsed}
                aria-controls="control-panel-body"
                onClick={() => {
                  setActiveTab(id);
                  setCollapseOverride(false);
                }}
                className={`relative flex items-center gap-1.5 px-2.5 py-3 text-xs font-semibold whitespace-nowrap transition-colors sm:gap-2 sm:px-4 sm:text-sm ${
                  selected ? "text-accent" : "text-ui-muted hover:text-ui-fg"
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                <span className="sm:hidden">{short}</span>
                <span className="max-sm:hidden">{label}</span>
                {id === "practice" &&
                  earTrainingTab.practice.phase !== "idle" && (
                    <span
                      className="size-1.5 rounded-full bg-green-500"
                      aria-label="(running)"
                    />
                  )}
                {selected && !isCollapsed && (
                  <motion.span
                    layoutId="control-panel-tab"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1.5 pr-1.5">
          {activeTab === "settings" && !isCollapsed && (
            <button
              type="button"
              onClick={onResetSettings}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-ui-muted transition-colors hover:bg-ui-surface-hover hover:text-ui-fg"
              title="Restore default settings. Your effects chain is kept."
              aria-label="Reset settings"
            >
              <RotateCcw size={13} />
              <span className="max-sm:hidden">Reset</span>
            </button>
          )}

          {activeTab === "effects" &&
            !isCollapsed &&
            effectChain.length > 0 && (
              <button
                type="button"
                onClick={() => setEffectChain([])}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-red-500/10"
                title="Remove all effects from the chain"
                aria-label="Clear all effects"
              >
                <Trash2 size={13} />
                <span className="max-sm:hidden">Clear all</span>
              </button>
            )}

          <motion.button
            type="button"
            onClick={() => setCollapseOverride(!isCollapsed)}
            className="rounded-lg p-1.5 text-ui-muted transition-colors hover:bg-ui-surface-hover hover:text-ui-fg"
            whileTap={{ scale: 0.9 }}
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            title={isCollapsed ? "Expand panel" : "Collapse panel"}
            aria-label={
              isCollapsed ? "Expand control panel" : "Collapse control panel"
            }
            aria-expanded={!isCollapsed}
            aria-controls="control-panel-body"
          >
            <ChevronsUpDown size={16} />
          </motion.button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="panel-body"
            id="control-panel-body"
            role="tabpanel"
            aria-labelledby={`tab-${activeTab}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
            style={{ overflow: "hidden" }}
          >
            <AnimatePresence mode="wait">
              {activeTab === "settings" && <SettingsTab {...settingsTab} />}

              {activeTab === "effects" && (
                <EffectsTab
                  effectChain={effectChain}
                  setEffectChain={setEffectChain}
                  borderColor="var(--ui-border)"
                />
              )}

              {activeTab === "practice" && (
                <EarTrainingTab {...earTrainingTab} />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const ControlPanel = React.memo(ControlPanelComponent);
