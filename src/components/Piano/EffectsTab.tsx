import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { GripVertical, Waves, Trash2, ChevronRight } from "lucide-react";
import {
  EffectNode,
  EffectType,
  createEffectNode,
  EffectParams,
  EffectParamsUpdate,
} from "@/lib/effects";
import { EFFECT_META } from "./ControlPanelTypes";
import { EffectCard } from "./EffectCard";

export interface EffectsTabProps {
  effectChain: EffectNode[];
  setEffectChain: React.Dispatch<React.SetStateAction<EffectNode[]>>;
  borderColor: string;
}

function GhostCard({ type, x, y }: { type: EffectType; x: number; y: number }) {
  const meta = EFFECT_META[type];
  return (
    <div
      className="fixed pointer-events-none z-9999 w-[200px] rounded-xl overflow-hidden shadow-2xl"
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
      <div className={`h-1 w-full bg-linear-to-r ${meta.color}`} />
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-2">
        <GripVertical size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
        <div
          className={`flex items-center justify-center w-6 h-6 rounded-md bg-linear-to-br text-white shrink-0 ${meta.color}`}
        >
          {meta.icon}
        </div>
        <span
          className="font-semibold text-[13px] flex-1 truncate"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          {type}
        </span>
      </div>
      <div className="px-3 pb-3">
        <div
          className="h-0.5 rounded-full mb-3"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />
        <div className="flex flex-col gap-2 opacity-40">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-4 rounded"
              style={{
                background: "rgba(255,255,255,0.1)",
                width: `${60 + i * 15}%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DropIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.5 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0.5 }}
      className="w-0.5 self-stretch mx-1 rounded-full"
      style={{
        background: "rgba(99,102,241,0.8)",
        boxShadow: "0 0 8px rgba(99,102,241,0.6)",
      }}
    />
  );
}

export function EffectsTab({
  effectChain,
  setEffectChain,
  borderColor,
}: EffectsTabProps) {
  const [draggingNewType, setDraggingNewType] = useState<EffectType | null>(
    null,
  );
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dropIndexRef = useRef<number | null>(null);
  const rackRef = useRef<HTMLDivElement>(null);
  const isDraggingNew = useRef(false);

  const removeEffect = useCallback(
    (id: string) => {
      setEffectChain((prev) => prev.filter((e) => e.id !== id));
    },
    [setEffectChain],
  );

  const toggleEnabled = useCallback(
    (id: string) => {
      setEffectChain((prev) =>
        prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e)),
      );
    },
    [setEffectChain],
  );

  const updateEffect = useCallback(
    (id: string, params: EffectParamsUpdate) => {
      setEffectChain((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, params: { ...e.params, ...params } as EffectParams }
            : e,
        ),
      );
    },
    [setEffectChain],
  );

  // Insert before the first card whose midpoint is right of the pointer.
  const computeDropIndex = useCallback(
    (clientX: number): number => {
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
    },
    [effectChain.length],
  );

  // Global listeners keep the drag active after the pointer leaves its source.
  useEffect(() => {
    if (!draggingNewType) return;

    const onMove = (e: PointerEvent) => {
      setGhostPos({ x: e.clientX, y: e.clientY });
      if (rackRef.current) {
        const rackRect = rackRef.current.getBoundingClientRect();
        const inRack =
          e.clientX >= rackRect.left &&
          e.clientX <= rackRect.right &&
          e.clientY >= rackRect.top - 30 &&
          e.clientY <= rackRect.bottom + 30;
        const nextDropIndex = inRack ? computeDropIndex(e.clientX) : null;
        dropIndexRef.current = nextDropIndex;
        setDropIndex(nextDropIndex);
      }
    };

    const onUp = () => {
      const index = dropIndexRef.current;
      if (draggingNewType && index !== null) {
        const node = createEffectNode(draggingNewType);
        setEffectChain((prev) => {
          const next = [...prev];
          next.splice(index, 0, node);
          return next;
        });
      }
      finishDrag();
    };

    const finishDrag = () => {
      setDraggingNewType(null);
      setDropIndex(null);
      dropIndexRef.current = null;
      isDraggingNew.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    const onCancel = () => finishDrag();

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onCancel);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onCancel);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [draggingNewType, computeDropIndex, setEffectChain]);

  const startAddDrag = (type: EffectType, e: React.PointerEvent) => {
    // Ignore secondary-button gestures.
    if (e.button !== 0) return;
    e.preventDefault();
    dropIndexRef.current = null;
    setDraggingNewType(type);
    setGhostPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <motion.div
        key="effects"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className="p-5"
      >
        <div className="mb-4">
          <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--panel-muted)" }}
          >
            Add Effect — click or drag into chain
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            {(Object.keys(EFFECT_META) as EffectType[]).map((type) => {
              const meta = EFFECT_META[type];
              return (
                <motion.button
                  key={type}
                  type="button"
                  onClick={() => {
                    // A completed drag must not also add an effect on click.
                    if (!isDraggingNew.current) {
                      setEffectChain((prev) => [
                        ...prev,
                        createEffectNode(type),
                      ]);
                    }
                  }}
                  onPointerDown={(e) => {
                    isDraggingNew.current = false;
                    // Wait for movement before treating the gesture as a drag.
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const onMove = (me: PointerEvent) => {
                      if (
                        Math.abs(me.clientX - startX) > 6 ||
                        Math.abs(me.clientY - startY) > 6
                      ) {
                        isDraggingNew.current = true;
                        startAddDrag(type, e as unknown as React.PointerEvent);
                        document.removeEventListener("pointermove", onMove);
                        document.removeEventListener("pointerup", onUp);
                        document.removeEventListener("pointercancel", onUp);
                      }
                    };
                    const onUp = () => {
                      document.removeEventListener("pointermove", onMove);
                      document.removeEventListener("pointerup", onUp);
                      document.removeEventListener("pointercancel", onUp);
                    };
                    document.addEventListener("pointermove", onMove);
                    document.addEventListener("pointerup", onUp);
                    document.addEventListener("pointercancel", onUp);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-linear-to-r ${meta.color} cursor-grab active:cursor-grabbing shadow-md select-none`}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: `0 6px 20px ${meta.glow}`,
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                  }}
                >
                  {meta.icon}
                  <span>{type}</span>
                </motion.button>
              );
            })}

            <AnimatePresence>
              {effectChain.length > 0 && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setEffectChain([])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-400 bg-red-500/10 border border-red-500/25 hover:bg-red-500/20 hover:text-red-300 transition-colors shadow-md cursor-pointer ml-auto"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 25,
                  }}
                >
                  <Trash2 size={12} />
                  <span>Clear All</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {effectChain.length === 0 && !draggingNewType ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border-2 border-dashed"
              style={{ borderColor, color: "var(--panel-muted)" }}
            >
              <Waves size={26} />
              <p className="text-sm">Drag effects here or click to add.</p>
            </motion.div>
          ) : (
            <div
              ref={rackRef}
              role="region"
              aria-label="Active effects chain"
              className="flex items-start overflow-x-auto pb-3 min-h-[80px]"
              style={{
                scrollbarWidth: "thin",
                outline: draggingNewType
                  ? "2px dashed rgba(99,102,241,0.5)"
                  : "none",
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
                      <AnimatePresence>
                        {dropIndex === index && (
                          <DropIndicator key="drop-before" />
                        )}
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
                          <ChevronRight
                            size={16}
                            style={{ color: "var(--panel-subtle)" }}
                          />
                        </motion.div>
                      )}
                    </React.Fragment>
                  ))}
                  <AnimatePresence>
                    {dropIndex === effectChain.length && (
                      <DropIndicator key="drop-end" />
                    )}
                  </AnimatePresence>
                </AnimatePresence>
              </Reorder.Group>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {draggingNewType && (
          <GhostCard type={draggingNewType} x={ghostPos.x} y={ghostPos.y} />
        )}
      </AnimatePresence>
    </>
  );
}
