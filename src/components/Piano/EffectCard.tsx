import { motion, Reorder, useDragControls } from "framer-motion";
import { GripVertical, Power, Trash2 } from "lucide-react";
import type {
  EffectMode,
  EffectNode,
  EffectNodeOf,
  EffectParamsUpdate,
  EffectType,
} from "@/lib/effects";
import {
  EFFECT_META,
  EFFECT_ICON_SIZE,
  EFFECT_CARD_WIDTH_PX,
} from "./effectMeta";
import {
  EFFECT_MODES,
  EFFECT_PARAM_SLIDERS,
  MIX_SLIDER_RANGE,
  formatMix,
  readParam,
  type ParamSliderSpec,
} from "./effectControls";

function ParamSlider({
  id,
  label,
  min,
  max,
  step,
  value,
  displayValue,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  displayValue: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label
          htmlFor={id}
          className="text-[11px] font-medium"
          style={{ color: "var(--panel-fg)" }}
        >
          {label}
        </label>
        <span
          className="text-[11px] font-mono px-1.5 py-px rounded"
          style={{
            background: "var(--panel-surface)",
            color: "var(--panel-fg)",
          }}
        >
          {displayValue}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        // Keep slider drags from starting a card reorder.
        onPointerDown={(e) => e.stopPropagation()}
        aria-valuetext={displayValue}
      />
    </div>
  );
}

/**
 * One effect in the rack: a drag handle, bypass and remove buttons, and the
 * controls for the effect's current mode.
 *
 * The mode selector and sliders are driven by the tables in `effectControls`,
 * so the markup does not need a branch per effect type.
 */
export function EffectCard<T extends EffectType>({
  effect,
  borderColor,
  onToggle,
  onRemove,
  onUpdate,
}: {
  effect: EffectNodeOf<T>;
  borderColor: string;
  onToggle: () => void;
  onRemove: () => void;
  onUpdate: (params: EffectParamsUpdate<T>) => void;
}) {
  const dragControls = useDragControls();
  const meta = EFFECT_META[effect.type];
  const modes = EFFECT_MODES[effect.type];
  const sliders = EFFECT_PARAM_SLIDERS[effect.type];

  const renderSlider = (spec: ParamSliderSpec<T>) => {
    const value = readParam(effect.params, spec.field);
    return (
      <ParamSlider
        key={spec.field as string}
        id={`${effect.id}-${String(spec.field)}`}
        label={spec.label}
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={value}
        displayValue={spec.format(value)}
        onChange={(next) =>
          onUpdate({ [spec.field]: next } as EffectParamsUpdate<T>)
        }
      />
    );
  };

  return (
    <Reorder.Item
      value={effect as EffectNode}
      dragListener={false}
      dragControls={dragControls}
      as="div"
      className="shrink-0"
      style={{ width: EFFECT_CARD_WIDTH_PX }}
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
          background: "var(--panel-surface)",
          border: `1px solid ${borderColor}`,
        }}
        whileHover={{
          background: "var(--panel-surface-hover)",
          borderColor,
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
            style={{ color: "var(--panel-fg)", flexShrink: 0 }}
          />

          <div
            className={`flex items-center justify-center w-6 h-6 rounded-md bg-linear-to-br text-white shrink-0 ${meta.color} ${!effect.enabled ? "grayscale opacity-50" : ""}`}
          >
            <meta.Icon size={EFFECT_ICON_SIZE} />
          </div>
          <span
            className="font-semibold text-[13px] flex-1 truncate"
            style={{ color: "var(--panel-fg)" }}
          >
            {effect.type}
          </span>

          <motion.button
            type="button"
            onClick={onToggle}
            className="p-1 rounded-md shrink-0 cursor-pointer"
            style={{
              background: effect.enabled
                ? "rgba(74,222,128,0.12)"
                : "var(--panel-surface)",
              color: effect.enabled ? "rgb(74,222,128)" : "var(--panel-fg)",
            }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            title={effect.enabled ? "Bypass" : "Enable"}
            aria-label={`${effect.enabled ? "Bypass" : "Enable"} ${effect.type}`}
            aria-pressed={effect.enabled}
          >
            <Power size={12} />
          </motion.button>
          <motion.button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-md shrink-0 cursor-pointer"
            style={{
              background: "rgba(248,113,113,0.1)",
              color: "rgb(248,113,113)",
            }}
            whileHover={{ scale: 1.15, background: "rgba(248,113,113,0.22)" }}
            whileTap={{ scale: 0.85 }}
            aria-label={`Remove ${effect.type}`}
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
            style={{ borderColor }}
          >
            {modes.length > 0 && (
              <select
                aria-label={`${effect.type} mode`}
                value={effect.params.mode}
                onChange={(e) =>
                  onUpdate({
                    mode: e.target.value as EffectMode<T>,
                  } as EffectParamsUpdate<T>)
                }
                className="w-full text-xs rounded px-2 py-1 mt-1 mb-2"
                onPointerDown={(e) => e.stopPropagation()}
              >
                {modes.map((mode) => (
                  <option
                    key={mode.value}
                    value={mode.value}
                    className="bg-gray-800"
                  >
                    {mode.label}
                  </option>
                ))}
              </select>
            )}

            <ParamSlider
              id={`${effect.id}-mix`}
              label="Mix"
              {...MIX_SLIDER_RANGE}
              value={effect.params.mix}
              displayValue={formatMix(effect.params.mix)}
              onChange={(mix) => onUpdate({ mix } as EffectParamsUpdate<T>)}
            />

            <div className="flex flex-col gap-2 mt-1">
              {sliders
                .filter(
                  (spec) =>
                    !spec.appliesTo ||
                    spec.appliesTo.includes(effect.params.mode),
                )
                .map(renderSlider)}
            </div>
          </div>
        </div>
      </motion.div>
    </Reorder.Item>
  );
}
