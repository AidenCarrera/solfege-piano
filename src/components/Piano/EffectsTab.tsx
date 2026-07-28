import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { GripVertical, Waves, ChevronRight } from "lucide-react";
import {
  EffectNode,
  EffectType,
  createEffectNode,
  EffectParamsUpdate,
} from "@/lib/effects";
import { EFFECT_META, EFFECT_ICON_SIZE } from "./effectMeta";
import { EffectCard } from "./EffectCard";

/**
 * Pointer travel before a press on an "Add Effect" button becomes a drag.
 * Below this, the gesture stays a click and appends to the end of the chain.
 */
const DRAG_ACTIVATION_DISTANCE_PX = 6;

/**
 * Vertical slack around the rack that still counts as "over" it, so a drop
 * does not require pixel-accurate aim at a short row.
 */
const RACK_DROP_TOLERANCE_PX = 30;

/** Offset of the ghost from the cursor, placing it under the grab point. */
const GHOST_OFFSET_Y_PX = 20;

export interface EffectsTabProps {
  effectChain: EffectNode[];
  setEffectChain: React.Dispatch<React.SetStateAction<EffectNode[]>>;
  borderColor: string;
}

/** The card that follows the cursor while dragging a new effect into the rack. */
function GhostCard({ type, x, y }: { type: EffectType; x: number; y: number }) {
  const meta = EFFECT_META[type];
  return (
    <div
      className="effect-card fixed pointer-events-none z-9999 rounded-xl overflow-hidden shadow-2xl"
      style={{
        left: x,
        top: y - GHOST_OFFSET_Y_PX,
        // Centred on the pointer by its own width, so the ghost stays a true
        // preview of the card without JS having to know how wide that is.
        transform: "translateX(-50%) rotate(3deg) scale(1.05)",
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
          <meta.Icon size={EFFECT_ICON_SIZE} />
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

/** Vertical bar marking where a dragged effect would be inserted. */
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

/**
 * The effects rack: a palette of effects to add, and the ordered signal chain.
 *
 * Reordering existing cards uses framer-motion's `Reorder`, but *adding* one
 * is hand-rolled on pointer events. Neither alternative works here: HTML5
 * drag-and-drop cannot render a live React preview and is unreliable on touch,
 * while framer's `drag` only moves an element within its own layout and cannot
 * hand an item off to a different list. So a press on a palette button starts
 * a global pointer capture, a fixed-position ghost tracks the cursor, and the
 * drop index is hit-tested against the cards' midpoints.
 */
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
            ? // The update is typed against the card's own effect, but the
              // merge happens against the erased union, so restate the node.
              ({ ...e, params: { ...e.params, ...params } } as EffectNode)
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
        // Opens to its full height; the page scrolls on a short screen rather
        // than the panel scrolling inside itself.
        className="p-3 sm:p-5"
      >
        <div className="mb-2.5 sm:mb-3">
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
                        Math.abs(me.clientX - startX) >
                          DRAG_ACTIVATION_DISTANCE_PX ||
                        Math.abs(me.clientY - startY) >
                          DRAG_ACTIVATION_DISTANCE_PX
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
                  // `touch-none` is load-bearing, not cosmetic: without it a
                  // finger that starts moving scrolls the panel instead, and
                  // the browser cancels the pointer stream before the drag
                  // threshold is ever crossed.
                  className={`flex touch-none items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold text-white bg-linear-to-r ${meta.color} cursor-grab select-none shadow-md active:cursor-grabbing sm:py-1.5`}
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
                  <meta.Icon size={EFFECT_ICON_SIZE} />
                  <span>{type}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {effectChain.length === 0 && !draggingNewType ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 sm:py-6"
              style={{ borderColor, color: "var(--panel-fg)" }}
            >
              <Waves size={26} />
              <p className="text-center text-sm">
                Tap an effect above to add it, or drag one in here.
              </p>
            </motion.div>
          ) : (
            <div
              ref={rackRef}
              role="region"
              aria-label="Active effects chain"
              className="flex min-h-20 items-start overflow-x-auto overscroll-x-contain pb-3"
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
