import React from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import { GripVertical, Power, Trash2 } from "lucide-react";
import { EffectNode, EffectParamsUpdate } from "@/lib/effects";
import { EFFECT_META } from "./ControlPanelTypes";

export function EffectCard({
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
  onUpdate: (params: EffectParamsUpdate) => void;
}) {
  const dragControls = useDragControls();
  const meta = EFFECT_META[effect.type];
  const p = effect.params as typeof effect.params & EffectParamsUpdate;

  const renderSlider = (
    label: string,
    field: string,
    min: number,
    max: number,
    step: number,
    val: number,
    format?: (v: number) => string,
  ) => (
    <div key={field} className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span
          className="text-[11px] font-medium"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          {label}
        </span>
        <span
          className="text-[11px] font-mono px-1.5 py-px rounded"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          {format ? format(val) : val.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
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
      whileDrag={{
        scale: 1.05,
        zIndex: 50,
        boxShadow: `0 20px 60px ${meta.glow}, 0 0 0 2px rgba(99,102,241,0.7)`,
      }}
    >
      <motion.div
        className="rounded-xl overflow-hidden flex flex-col h-full"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${borderColor}`,
        }}
        whileHover={{
          background: "rgba(255,255,255,0.07)",
          borderColor: "rgba(255,255,255,0.15)",
          transition: { duration: 0.15 },
        }}
      >
        <div
          className={`h-1 w-full bg-linear-to-r ${meta.color} ${!effect.enabled ? "opacity-30" : ""}`}
        />

        <div
          className="flex items-center gap-2 px-3 pt-2.5 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={(e) => {
            // Preserve button interactions inside the drag handle.
            if ((e.target as HTMLElement).closest("button")) return;
            dragControls.start(e);
          }}
        >
          <GripVertical
            size={14}
            style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }}
          />

          <div
            className={`flex items-center justify-center w-6 h-6 rounded-md bg-linear-to-br text-white shrink-0 ${meta.color} ${!effect.enabled ? "grayscale opacity-50" : ""}`}
          >
            {meta.icon}
          </div>
          <span
            className="font-semibold text-[13px] flex-1 truncate"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            {effect.type}
          </span>

          <motion.button
            onClick={onToggle}
            className="p-1 rounded-md shrink-0 cursor-pointer"
            style={{
              background: effect.enabled
                ? "rgba(74,222,128,0.12)"
                : "rgba(255,255,255,0.05)",
              color: effect.enabled
                ? "rgb(74,222,128)"
                : "rgba(255,255,255,0.3)",
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            title={effect.enabled ? "Bypass" : "Enable"}
          >
            <Power size={12} />
          </motion.button>
          <motion.button
            onClick={onRemove}
            className="p-1 rounded-md shrink-0 cursor-pointer"
            style={{
              background: "rgba(248,113,113,0.1)",
              color: "rgb(248,113,113)",
            }}
            whileHover={{ scale: 1.15, background: "rgba(248,113,113,0.22)" }}
            whileTap={{ scale: 0.85 }}
          >
            <Trash2 size={12} />
          </motion.button>
        </div>

        <div
          className="px-3 pb-3 flex flex-col gap-2 flex-1 transition-opacity duration-200"
          style={{
            opacity: effect.enabled ? 1 : 0.3,
            pointerEvents: effect.enabled ? "auto" : "none",
          }}
        >
          <div
            className="flex flex-col gap-2 pt-1 border-t"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            {effect.type === "Reverb" && (
              <select
                value={p.mode}
                onChange={(e) =>
                  onUpdate({
                    mode: e.target.value as NonNullable<
                      EffectParamsUpdate["mode"]
                    >,
                  })
                }
                className="w-full bg-white/10 border border-white/10 text-white text-xs rounded px-2 py-1 outline-none mt-1 hover:bg-white/20 transition-colors mb-2"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <option value="Native" className="bg-gray-800">
                  Convolver
                </option>
                <option value="Chamber" className="bg-gray-800">
                  Chamber
                </option>
              </select>
            )}
            {effect.type === "Delay" && (
              <select
                value={p.mode}
                onChange={(e) =>
                  onUpdate({
                    mode: e.target.value as NonNullable<
                      EffectParamsUpdate["mode"]
                    >,
                  })
                }
                className="w-full bg-white/10 border border-white/10 text-white text-xs rounded px-2 py-1 outline-none mt-1 hover:bg-white/20 transition-colors mb-2"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <option value="Feedback" className="bg-gray-800">
                  Feedback
                </option>
                <option value="PingPong" className="bg-gray-800">
                  Ping-Pong
                </option>
              </select>
            )}
            {effect.type === "Modulation" && (
              <select
                value={p.mode}
                onChange={(e) =>
                  onUpdate({
                    mode: e.target.value as NonNullable<
                      EffectParamsUpdate["mode"]
                    >,
                  })
                }
                className="w-full bg-white/10 border border-white/10 text-white text-xs rounded px-2 py-1 outline-none mt-1 hover:bg-white/20 transition-colors mb-2"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <option value="Chorus" className="bg-gray-800">
                  Chorus
                </option>
                <option value="Vibrato" className="bg-gray-800">
                  Vibrato
                </option>
                <option value="Phaser" className="bg-gray-800">
                  Phaser
                </option>
              </select>
            )}
            {effect.type === "Distortion" && (
              <select
                value={p.mode}
                onChange={(e) =>
                  onUpdate({
                    mode: e.target.value as NonNullable<
                      EffectParamsUpdate["mode"]
                    >,
                  })
                }
                className="w-full bg-white/10 border border-white/10 text-white text-xs rounded px-2 py-1 outline-none mt-1 hover:bg-white/20 transition-colors mb-2"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <option value="Distortion" className="bg-gray-800">
                  Overdrive
                </option>
                <option value="BitCrusher" className="bg-gray-800">
                  BitCrusher
                </option>
                <option value="Chebyshev" className="bg-gray-800">
                  Wavefolder
                </option>
              </select>
            )}
            {effect.type === "Filter" && (
              <select
                value={p.mode}
                onChange={(e) =>
                  onUpdate({
                    mode: e.target.value as NonNullable<
                      EffectParamsUpdate["mode"]
                    >,
                  })
                }
                className="w-full bg-white/10 border border-white/10 text-white text-xs rounded px-2 py-1 outline-none mt-1 hover:bg-white/20 transition-colors mb-2"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <option value="AutoWah" className="bg-gray-800">
                  AutoWah
                </option>
                <option value="AutoFilter" className="bg-gray-800">
                  AutoFilter
                </option>
              </select>
            )}

            {renderSlider(
              "Mix",
              "mix",
              0,
              1,
              0.01,
              p.mix,
              (v) => `${Math.round(v * 100)}%`,
            )}

            <div className="flex flex-col gap-2 mt-1">
              {effect.type === "Reverb" && (
                <>
                  {p.mode === "Native" && (
                    <>
                      {renderSlider(
                        "Decay",
                        "decay",
                        0.5,
                        10,
                        0.1,
                        p.decay ?? 2.5,
                        (v) => `${v.toFixed(1)}s`,
                      )}
                      {renderSlider(
                        "Pre-Delay",
                        "preDelay",
                        0,
                        0.15,
                        0.005,
                        p.preDelay ?? 0.01,
                        (v) => `${Math.round(v * 1000)}ms`,
                      )}
                    </>
                  )}
                  {p.mode === "Chamber" && (
                    <>
                      {renderSlider(
                        "Pre-Delay",
                        "preDelay",
                        0,
                        0.15,
                        0.005,
                        p.preDelay ?? 0.01,
                        (v) => `${Math.round(v * 1000)}ms`,
                      )}
                      {renderSlider(
                        "Room Size",
                        "roomSize",
                        0,
                        1,
                        0.01,
                        p.roomSize ?? 0.5,
                        (v) => `${Math.round(v * 100)}%`,
                      )}
                    </>
                  )}
                </>
              )}
              {effect.type === "Delay" && (
                <>
                  {renderSlider(
                    "Time",
                    "delayTime",
                    0.01,
                    1,
                    0.01,
                    p.delayTime ?? 0.25,
                    (v) => `${Math.round(v * 1000)}ms`,
                  )}
                  {renderSlider(
                    "Feedback",
                    "feedback",
                    0,
                    0.9,
                    0.01,
                    p.feedback ?? 0.4,
                    (v) => `${Math.round(v * 100)}%`,
                  )}
                </>
              )}
              {effect.type === "Modulation" && (
                <>
                  {renderSlider(
                    "Rate",
                    "frequency",
                    0.1,
                    10,
                    0.1,
                    p.frequency ?? 1.5,
                    (v) => `${v.toFixed(1)}Hz`,
                  )}
                  {p.mode !== "Phaser" &&
                    renderSlider(
                      "Depth",
                      "depth",
                      0,
                      1,
                      0.01,
                      p.depth ?? 0.5,
                      (v) => `${Math.round(v * 100)}%`,
                    )}
                </>
              )}
              {effect.type === "Distortion" && (
                <>
                  {renderSlider(
                    "Amount",
                    "amount",
                    0,
                    1,
                    0.01,
                    p.amount ?? 0.5,
                    (v) => `${Math.round(v * 100)}%`,
                  )}
                </>
              )}
              {effect.type === "Compressor" && (
                <>
                  {renderSlider(
                    "Threshold",
                    "threshold",
                    -60,
                    0,
                    1,
                    p.threshold ?? -24,
                    (v) => `${v}dB`,
                  )}
                  {renderSlider(
                    "Ratio",
                    "ratio",
                    1,
                    20,
                    0.5,
                    p.ratio ?? 4,
                    (v) => `${v}:1`,
                  )}
                </>
              )}
              {effect.type === "Filter" && (
                <>
                  {renderSlider(
                    "Base Freq",
                    "baseFrequency",
                    50,
                    2000,
                    10,
                    p.baseFrequency ?? 150,
                    (v) => `${v}Hz`,
                  )}
                  {renderSlider(
                    "Octaves",
                    "octaves",
                    1,
                    8,
                    0.5,
                    p.octaves ?? 4,
                    (v) => `${v}`,
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Reorder.Item>
  );
}
