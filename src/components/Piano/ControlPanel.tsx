"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import {
  GripVertical, Trash2, Power,
  Wind, Clock, Music, Waves, Zap, Settings2,
  ChevronRight, ChevronsUpDown
} from "lucide-react";
import { EffectNode, EffectType, createEffectNode, EffectParams } from "@/lib/effects";
import { SOUND_OPTIONS, type SoundType } from "@/lib/config";
import { getGlassPanelColor } from "@/lib/colorUtils";

const OCTAVE_MAP: Record<number, [number, number]> = {
  1: [3, 4],
  2: [3, 5],
  3: [2, 5],
  4: [2, 6],
};

const EFFECT_META: Record<EffectType, { icon: React.ReactNode; color: string; glow: string; description: string }> = {
  AutoWah: { icon: <Zap size={14} />, color: "from-pink-500 to-rose-500", glow: "rgba(236,72,153,0.5)", description: "Filter sweep" },
  Chorus:  { icon: <Music size={14} />, color: "from-emerald-500 to-teal-500",  glow: "rgba(16,185,129,0.5)", description: "Shimmer & width" },
  Delay:   { icon: <Clock size={14} />, color: "from-blue-500 to-cyan-500",     glow: "rgba(59,130,246,0.5)", description: "Echo repeat" },
  Reverb:  { icon: <Wind size={14} />,  color: "from-violet-500 to-purple-600", glow: "rgba(139,92,246,0.5)",  description: "Room ambience" },
};

interface ControlPanelProps {
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

// Ghost card shown while dragging from add buttons
function GhostCard({ type, x, y }: { type: EffectType; x: number; y: number }) {
  const meta = EFFECT_META[type];
  return (
    <div
      className="fixed pointer-events-none z-[9999] w-[200px] rounded-xl overflow-hidden shadow-2xl"
      style={{
        left: x - 100,
        top: y - 20,
        transform: "rotate(3deg) scale(1.05)",
        background: "rgba(20,20,35,0.95)",
        border: "1px solid rgba(99,102,241,0.7)",
        boxShadow: `0 20px 60px ${meta.glow}`,
        opacity: 0.92,
      }}
    >
      <div className={`h-1 w-full bg-gradient-to-r ${meta.color}`} />
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
        <GripVertical size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
        <div className={`flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br text-white shrink-0 ${meta.color}`}>
          {meta.icon}
        </div>
        <span className="font-semibold text-[13px] flex-1 truncate" style={{ color: "rgba(255,255,255,0.9)" }}>
          {type}
        </span>
      </div>
      <div className="px-3 pb-3">
        <div className="h-0.5 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="flex flex-col gap-2 opacity-40">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 rounded" style={{ background: "rgba(255,255,255,0.1)", width: `${60 + i * 15}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Drop position indicator shown between cards
function DropIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.5 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0.5 }}
      className="w-0.5 self-stretch mx-1 rounded-full"
      style={{ background: "rgba(99,102,241,0.8)", boxShadow: "0 0 8px rgba(99,102,241,0.6)" }}
    />
  );
}

function EffectCard({
  effect,
  borderColor,
  onToggle,
  onRemove,
  onUpdate,
}: {
  effect: EffectNode;
  borderColor: string;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (params: Partial<EffectParams>) => void;
}) {
  const dragControls = useDragControls();
  const meta = EFFECT_META[effect.type];
  const p = effect.params as any;

  const renderSlider = (
    label: string,
    field: string,
    min: number, max: number, step: number, val: number,
    format?: (v: number) => string
  ) => (
    <div key={field} className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
        <span className="text-[11px] font-mono px-1.5 py-px rounded" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}>
          {format ? format(val) : val.toFixed(2)}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={val}
        onChange={(e) => onUpdate({ [field]: parseFloat(e.target.value) })}
        className="w-full"
        onPointerDown={(e) => e.stopPropagation()}
      />
    </div>
  );

  return (
    <Reorder.Item
      value={effect}
      dragListener={false}
      dragControls={dragControls}
      as="div"
      className="shrink-0"
      style={{ width: 200 }}
      initial={{ opacity: 0, scale: 0.85, x: -20 }}
      animate={{ opacity: effect.enabled ? 1 : 0.45, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: 20 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      whileDrag={{ scale: 1.05, zIndex: 50, boxShadow: `0 20px 60px ${meta.glow}, 0 0 0 2px rgba(99,102,241,0.7)` }}
    >
      <motion.div
        className="rounded-xl overflow-hidden flex flex-col h-full"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${borderColor}`,
        }}
        whileHover={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.15)", transition: { duration: 0.15 } }}
      >
        {/* Gradient top bar — also a drag handle */}
        <div className={`h-1 w-full bg-gradient-to-r ${meta.color} ${!effect.enabled ? "opacity-30" : ""}`} />

        {/* Header — entire area is draggable */}
        <div
          className="flex items-center gap-2 px-3 pt-2.5 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={(e) => {
            // Don't start drag from buttons
            if ((e.target as HTMLElement).closest("button")) return;
            dragControls.start(e);
          }}
        >
          <GripVertical size={14} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />

          <div className={`flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br text-white shrink-0 ${meta.color} ${!effect.enabled ? "grayscale opacity-50" : ""}`}>
            {meta.icon}
          </div>
          <span className="font-semibold text-[13px] flex-1 truncate" style={{ color: "rgba(255,255,255,0.9)" }}>
            {effect.type}
          </span>

          <motion.button
            onClick={onToggle}
            className="p-1 rounded-md shrink-0 cursor-pointer"
            style={{
              background: effect.enabled ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.05)",
              color: effect.enabled ? "rgb(74,222,128)" : "rgba(255,255,255,0.3)",
            }}
            whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
            title={effect.enabled ? "Bypass" : "Enable"}
          >
            <Power size={12} />
          </motion.button>
          <motion.button
            onClick={onRemove}
            className="p-1 rounded-md shrink-0 cursor-pointer"
            style={{ background: "rgba(248,113,113,0.1)", color: "rgb(248,113,113)" }}
            whileHover={{ scale: 1.15, background: "rgba(248,113,113,0.22)" }} whileTap={{ scale: 0.85 }}
          >
            <Trash2 size={12} />
          </motion.button>
        </div>

        {/* Params — greyed out when bypassed, but always visible */}
        <div
          className="px-3 pb-3 flex flex-col gap-2 flex-1 transition-opacity duration-200"
          style={{ opacity: effect.enabled ? 1 : 0.3, pointerEvents: effect.enabled ? "auto" : "none" }}
        >
          <div className="flex flex-col gap-2 pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            {renderSlider("Mix", "mix", 0, 1, 0.01, p.mix, v => `${Math.round(v * 100)}%`)}
            {effect.type === "Reverb" && <>
              {renderSlider("Decay", "decay", 0.5, 10, 0.1, p.decay, v => `${v.toFixed(1)}s`)}
              {renderSlider("Pre-Delay", "preDelay", 0, 0.15, 0.005, p.preDelay, v => `${Math.round(v * 1000)}ms`)}
            </>}
            {effect.type === "Delay" && <>
              {renderSlider("Time", "delayTime", 0.01, 1, 0.01, p.delayTime, v => `${Math.round(v * 1000)}ms`)}
              {renderSlider("Feedback", "feedback", 0, 0.9, 0.01, p.feedback, v => `${Math.round(v * 100)}%`)}
            </>}
            {effect.type === "Chorus" && <>
              {renderSlider("Rate", "frequency", 0.1, 10, 0.1, p.frequency, v => `${v.toFixed(1)}Hz`)}
              {renderSlider("Depth", "depth", 0, 1, 0.01, p.depth, v => `${Math.round(v * 100)}%`)}
            </>}
            {effect.type === "AutoWah" && <>
              {renderSlider("Base Freq", "baseFrequency", 50, 2000, 10, p.baseFrequency, v => `${v}Hz`)}
              {renderSlider("Octaves", "octaves", 1, 8, 0.5, p.octaves, v => `${v}`)}
            </>}
          </div>
        </div>
      </motion.div>
    </Reorder.Item>
  );
}

export default function ControlPanel({
  volume, setVolume,
  effectChain, setEffectChain,
  labelsEnabled, setLabelsEnabled,
  solfegeEnabled, setSolfegeEnabled,
  pianoScale, setPianoScale,
  bgColor, setBgColor,
  soundType, setSoundType,
  startOctave, endOctave, onOctaveChange,
  textColor,
}: ControlPanelProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "effects">("settings");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Drag-from-add-button state
  const [draggingNewType, setDraggingNewType] = useState<EffectType | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const rackRef = useRef<HTMLDivElement>(null);
  const isDraggingNew = useRef(false);

  useEffect(() => { setIsMounted(true); }, []);

  const sliderValue = Object.entries(OCTAVE_MAP).find(
    ([, range]) => range[0] === startOctave && range[1] === endOctave
  )?.[0] ?? "2";

  useEffect(() => {
    if (soundType === "Solfege") setPianoScale(1.5);
  }, [soundType, setPianoScale]);

  const handleOctaveSlider = (val: number) => {
    const range = OCTAVE_MAP[val];
    if (!range) return;
    const [start, end] = range;
    onOctaveChange(start, end);
    const scaleMap: Record<number, number> = { 2: 1.5, 3: 1.4, 4: 1.0, 5: 0.8 };
    setPianoScale(scaleMap[end - start + 1] ?? 1.5);
  };

  const panelBg = useMemo(() => getGlassPanelColor(bgColor), [bgColor]);
  const borderColor = textColor === "#ffffff" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";

  const removeEffect = useCallback((id: string) => {
    setEffectChain(prev => prev.filter(e => e.id !== id));
  }, [setEffectChain]);

  const toggleEnabled = useCallback((id: string) => {
    setEffectChain(prev => prev.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
  }, [setEffectChain]);

  const updateEffect = useCallback((id: string, params: Partial<EffectParams>) => {
    setEffectChain(prev => prev.map(e =>
      e.id === id ? { ...e, params: { ...e.params, ...params } as EffectParams } : e
    ));
  }, [setEffectChain]);

  // Compute which slot the ghost should drop into based on cursor X over the rack
  const computeDropIndex = useCallback((clientX: number): number => {
    if (!rackRef.current) return effectChain.length;
    const cards = rackRef.current.querySelectorAll("[data-effect-card]");
    let closest = effectChain.length;
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i]!.getBoundingClientRect();
      if (clientX < rect.left + rect.width / 2) {
        closest = i;
        break;
      }
    }
    return closest;
  }, [effectChain.length]);

  // Global pointer handlers during a "drag from add" gesture
  useEffect(() => {
    if (!draggingNewType) return;

    const onMove = (e: PointerEvent) => {
      setGhostPos({ x: e.clientX, y: e.clientY });
      if (rackRef.current) {
        const rackRect = rackRef.current.getBoundingClientRect();
        const inRack = e.clientX >= rackRect.left && e.clientX <= rackRect.right &&
                       e.clientY >= rackRect.top - 30 && e.clientY <= rackRect.bottom + 30;
        setDropIndex(inRack ? computeDropIndex(e.clientX) : null);
      }
    };

    const onUp = (e: PointerEvent) => {
      if (draggingNewType) {
        const idx = dropIndex ?? effectChain.length;
        const node = createEffectNode(draggingNewType);
        setEffectChain(prev => {
          const next = [...prev];
          next.splice(idx, 0, node);
          return next;
        });
      }
      setDraggingNewType(null);
      setDropIndex(null);
      isDraggingNew.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [draggingNewType, dropIndex, effectChain.length, computeDropIndex, setEffectChain]);

  const startAddDrag = (type: EffectType, e: React.PointerEvent) => {
    // Only trigger on primary button drag (not clicks)
    if (e.button !== 0) return;
    e.preventDefault();
    setDraggingNewType(type);
    setGhostPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className="glass-panel rounded-2xl mb-6 w-full max-w-4xl overflow-hidden"
      style={{ backgroundColor: panelBg, borderColor, color: textColor }}
    >
      {/* Tab Bar */}
      <div className="flex border-b relative items-center" style={{ borderColor }}>
        {(["settings", "effects"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setIsCollapsed(false);
            }}
            className="relative flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-colors duration-150 cursor-pointer"
            style={{ color: activeTab === tab ? "rgb(129,140,248)" : "rgba(255,255,255,0.45)" }}
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
          onClick={() => setIsCollapsed(c => !c)}
          className="ml-auto mr-3 p-1.5 rounded-lg cursor-pointer"
          style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}
          whileHover={{ color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: isCollapsed ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          title={isCollapsed ? "Expand panel" : "Collapse panel"}
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
                <motion.div
                  key="effects"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="p-5"
                >
                  {/* Add Effect pills — draggable into chain */}
                  <div className="mb-4">
                    <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Add Effect — click or drag into chain
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(EFFECT_META) as EffectType[]).map((type) => {
                        const meta = EFFECT_META[type];
                        return (
                          <motion.button
                            key={type}
                            onClick={() => {
                              // Only add on click if it wasn't a drag gesture
                              if (!isDraggingNew.current) {
                                setEffectChain(prev => [...prev, createEffectNode(type)]);
                              }
                            }}
                            onPointerDown={(e) => {
                              isDraggingNew.current = false;
                              // Delay to disambiguate click vs drag
                              const startX = e.clientX;
                              const startY = e.clientY;
                              const onMove = (me: PointerEvent) => {
                                if (Math.abs(me.clientX - startX) > 6 || Math.abs(me.clientY - startY) > 6) {
                                  isDraggingNew.current = true;
                                  startAddDrag(type, e as unknown as React.PointerEvent);
                                  document.removeEventListener("pointermove", onMove);
                                  document.removeEventListener("pointerup", onUp);
                                }
                              };
                              const onUp = () => {
                                document.removeEventListener("pointermove", onMove);
                                document.removeEventListener("pointerup", onUp);
                              };
                              document.addEventListener("pointermove", onMove);
                              document.addEventListener("pointerup", onUp);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-gradient-to-r ${meta.color} cursor-grab active:cursor-grabbing shadow-md select-none`}
                            whileHover={{ scale: 1.05, boxShadow: `0 6px 20px ${meta.glow}` }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          >
                            {meta.icon}
                            <span>{type}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chain */}
                  <AnimatePresence mode="wait">
                    {effectChain.length === 0 && !draggingNewType ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border-2 border-dashed"
                        style={{ borderColor, color: "rgba(255,255,255,0.25)" }}
                      >
                        <Waves size={26} />
                        <p className="text-sm">Drag effects here or click to add.</p>
                      </motion.div>
                    ) : (
                      isMounted && (
                        <div
                          ref={rackRef}
                          className="flex items-start overflow-x-auto pb-3 min-h-[80px]"
                          style={{
                            scrollbarWidth: "thin",
                            // Highlight drop zone when dragging new effect
                            outline: draggingNewType ? "2px dashed rgba(99,102,241,0.5)" : "none",
                            outlineOffset: "4px",
                            borderRadius: "12px",
                            transition: "outline 0.15s ease",
                          }}
                        >
                          <Reorder.Group
                            axis="x"
                            values={effectChain}
                            onReorder={setEffectChain}
                            as="div"
                            className="flex items-start gap-0"
                            style={{ listStyle: "none", padding: 0, margin: 0 }}
                          >
                            <AnimatePresence initial={false}>
                              {effectChain.map((effect, index) => (
                                <React.Fragment key={effect.id}>
                                  {/* Drop indicator before this card */}
                                  <AnimatePresence>
                                    {dropIndex === index && <DropIndicator key="drop-before" />}
                                  </AnimatePresence>
                                  <div data-effect-card="true">
                                    <EffectCard
                                      effect={effect}
                                      borderColor={borderColor}
                                      onToggle={() => toggleEnabled(effect.id)}
                                      onRemove={() => removeEffect(effect.id)}
                                      onUpdate={(params) => updateEffect(effect.id, params)}
                                    />
                                  </div>
                                  {index < effectChain.length - 1 && (
                                    <motion.div
                                      className="flex items-center self-stretch shrink-0 px-1"
                                      initial={{ opacity: 0, scale: 0.5 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.5 }}
                                      transition={{ delay: 0.1 }}
                                    >
                                      <ChevronRight size={16} style={{ color: "rgba(255,255,255,0.2)" }} />
                                    </motion.div>
                                  )}
                                </React.Fragment>
                              ))}
                              {/* Drop indicator at end */}
                              <AnimatePresence>
                                {dropIndex === effectChain.length && <DropIndicator key="drop-end" />}
                              </AnimatePresence>
                            </AnimatePresence>
                          </Reorder.Group>
                        </div>
                      )
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
                >
                  {/* Volume */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>Volume</label>
                      <span className="text-[11px] font-mono px-1.5 py-px rounded" style={{ background: "rgba(255,255,255,0.08)" }}>{Math.round(volume * 100)}%</span>
                    </div>
                    <input type="range" min={0} max={1} step={0.01} value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-full" />
                  </div>

                  {/* Sound Type */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>Sound Type</label>
                    <select value={soundType} onChange={(e) => setSoundType(e.target.value as SoundType)} className="text-sm">
                      {SOUND_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Octave Range */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>Octave Range</label>
                      <span className="text-[11px] font-mono px-1.5 py-px rounded" style={{ background: "rgba(255,255,255,0.08)" }}>C{startOctave}–C{endOctave}</span>
                    </div>
                    <input type="range" min={1} max={4} step={1} value={parseInt(sliderValue)}
                      onChange={(e) => handleOctaveSlider(parseInt(e.target.value))} className="w-full"
                      disabled={soundType === "Solfege"} />
                    {soundType === "Solfege" && (
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Locked to 1 octave in Solfege mode</span>
                    )}
                  </div>

                  {/* Zoom */}
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>Zoom</label>
                      <span className="text-[11px] font-mono px-1.5 py-px rounded" style={{ background: "rgba(255,255,255,0.08)" }}>{pianoScale.toFixed(2)}×</span>
                    </div>
                    <input type="range" min={0.5} max={2} step={0.01} value={pianoScale}
                      onChange={(e) => setPianoScale(parseFloat(e.target.value))} className="w-full" />
                  </div>

                  {/* Background */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>Background</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent p-0.5" />
                      <span className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.45)" }}>{bgColor}</span>
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.45)" }}>Labels</label>
                    <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                      <input type="checkbox" checked={labelsEnabled} onChange={(e) => setLabelsEnabled(e.target.checked)} />
                      Keyboard
                    </label>
                    <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                      <input type="checkbox" checked={solfegeEnabled} onChange={(e) => setSolfegeEnabled(e.target.checked)} />
                      Solfege
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ghost card — follows cursor during drag-from-add */}
      <AnimatePresence>
        {draggingNewType && (
          <GhostCard type={draggingNewType} x={ghostPos.x} y={ghostPos.y} />
        )}
      </AnimatePresence>
    </div>
  );
}
