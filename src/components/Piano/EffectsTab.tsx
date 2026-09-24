import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { GripVertical, Waves, ChevronRight, Plus } from "lucide-react";
import {
  EffectNode,
  EffectType,
  createEffectNode,
  EffectParamsUpdate,
} from "@/lib/effects";
import { EFFECT_META, EFFECT_ICON_SIZE } from "./effectMeta";
import { EffectCard } from "./EffectCard";

const DRAG_ACTIVATION_DISTANCE_PX = 6;

const RACK_DROP_TOLERANCE_PX = 30;

const GHOST_OFFSET_Y_PX = 20;

export interface EffectsTabProps {
  effectChain: EffectNode[];
  setEffectChain: React.Dispatch<React.SetStateAction<EffectNode[]>>;
  borderColor: string;
}

function GhostCard({ type, x, y }: { type: EffectType; x: number; y: number }) {
  const meta = EFFECT_META[type];
  return (
    <div
      className="effect-card fixed pointer-events-none z-9999 rounded-xl overflow-hidden shadow-2xl"
      style={{
        left: x,
        top: y - GHOST_OFFSET_Y_PX,
        transform: "translateX(-50%) rotate(3deg) scale(1.05)",
        background: "rgba(20,20,35,0.95)",
        border: "1px solid rgba(99,102,241,0.7)",
        boxShadow: `0 20px 60px ${meta.glow}`,
        opacity: 0.92,
      }}
    >
      <div className={`h-1 w-full bg-linear-to-r ${meta.color}`} />
      <div className="flex items-center gap-1.5 px-2.5 py-1.5">
        <GripVertical size={12} style={{ color: "rgba(255,255,255,0.4)" }} />
        <div
          className={`flex items-center justify-center size-5 rounded-md bg-linear-to-br text-white shrink-0 ${meta.color}`}
        >
          <meta.Icon size={EFFECT_ICON_SIZE} />
        </div>
        <span
          className="font-semibold text-[13px] flex-1 truncate"
          style={{ color: "rgba(255,255,255,0.9)" }}
        >
          {type}
        </span>
      </div>
      <div className="px-2.5 pb-2.5">
        <div
          className="h-0.5 rounded-full mb-2"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />
        <div className="flex flex-col gap-1.5 opacity-40">
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

/**
 * Runs `onDrag` once the pointer has travelled far enough to mean a drag rather
 * than a tap, so a plain click on a palette button still appends the effect.
 */
function watchForDrag(startX: number, startY: number, onDrag: () => void) {
  const onMove = (e: PointerEvent) => {
    if (
      Math.abs(e.clientX - startX) <= DRAG_ACTIVATION_DISTANCE_PX &&
      Math.abs(e.clientY - startY) <= DRAG_ACTIVATION_DISTANCE_PX
    ) {
      return;
    }
    stop();
    onDrag();
  };

  const stop = () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", stop);
    document.removeEventListener("pointercancel", stop);
  };

  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", stop);
  document.addEventListener("pointercancel", stop);
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

// Existing cards use Reorder; palette-to-rack drags use global pointer events.
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
    <T extends EffectType>(id: string, params: EffectParamsUpdate<T>) => {
      setEffectChain((prev) =>
        prev.map((e) =>
          e.id === id
            ? // TypeScript loses the effect-to-params correlation in the union.
              ({ ...e, params: { ...e.params, ...params } } as EffectNode)
            : e,
        ),
      );
    },
    [setEffectChain],
  );

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

  useEffect(() => {
    if (!draggingNewType) return;

    const onMove = (e: PointerEvent) => {
      setGhostPos({ x: e.clientX, y: e.clientY });
      if (rackRef.current) {
        const rackRect = rackRef.current.getBoundingClientRect();
        const inRack =
          e.clientX >= rackRect.left &&
          e.clientX <= rackRect.right &&
          e.clientY >= rackRect.top - RACK_DROP_TOLERANCE_PX &&
          e.clientY <= rackRect.bottom + RACK_DROP_TOLERANCE_PX;
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

  const startAddDrag = (type: EffectType, x: number, y: number) => {
    dropIndexRef.current = null;
    setDraggingNewType(type);
    setGhostPos({ x, y });
  };

  return (
    <>
      <motion.div
        key="effects"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className="p-3 sm:p-4"
      >
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {(Object.keys(EFFECT_META) as EffectType[]).map((type) => {
            const meta = EFFECT_META[type];
            return (
              <motion.button
                key={type}
                type="button"
                onClick={() => {
                  if (!isDraggingNew.current) {
                    setEffectChain((prev) => [...prev, createEffectNode(type)]);
                  }
                }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  isDraggingNew.current = false;
                  const { clientX, clientY } = e;
                  watchForDrag(clientX, clientY, () => {
                    isDraggingNew.current = true;
                    startAddDrag(type, clientX, clientY);
                  });
                }}
                // Preserve the pointer stream during touch drags.
                className="flex touch-none items-center gap-1.5 rounded-lg border border-ui-border bg-ui-surface py-1 pr-2.5 pl-1 text-[12px] font-semibold text-ui-fg cursor-grab select-none transition-colors hover:bg-ui-surface-hover active:cursor-grabbing"
                title={`${meta.description}. Click to add, or drag into the chain.`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 25,
                }}
              >
                <span
                  className={`flex size-5 items-center justify-center rounded-md bg-linear-to-br text-white ${meta.color}`}
                >
                  <meta.Icon size={EFFECT_ICON_SIZE} />
                </span>
                <span>{type}</span>
                <Plus size={12} className="text-ui-subtle" aria-hidden="true" />
              </motion.button>
            );
          })}
        </div>

        <div
          ref={rackRef}
          role="region"
          aria-label="Active effects chain"
          className="flex min-h-20 items-start overflow-x-auto overscroll-x-contain pb-2"
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
          {effectChain.length === 0 && !draggingNewType ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed py-3 text-ui-muted sm:py-4"
              style={{ borderColor }}
            >
              <Waves size={20} />
              <p className="text-center text-sm">
                Tap an effect above to add it, or drag one in here.
              </p>
            </motion.div>
          ) : (
            <Reorder.Group
              axis="x"
              values={effectChain}
              onReorder={setEffectChain}
              as="div"
              className="flex items-start"
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
                          style={{ color: "var(--panel-fg)" }}
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
          )}
        </div>
      </motion.div>

      {draggingNewType && (
        <GhostCard type={draggingNewType} x={ghostPos.x} y={ghostPos.y} />
      )}
    </>
  );
}
