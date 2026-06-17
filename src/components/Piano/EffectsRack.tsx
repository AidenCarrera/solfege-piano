"use client";

import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Trash2, GripVertical, Plus } from "lucide-react";
import { EffectNode, EffectType, createEffectNode, EffectParams } from "@/lib/effects";

interface EffectsRackProps {
  effectChain: EffectNode[];
  setEffectChain: React.Dispatch<React.SetStateAction<EffectNode[]>>;
}

export default function EffectsRack({ effectChain, setEffectChain }: EffectsRackProps) {
  const [selectedEffect, setSelectedEffect] = useState<EffectType>("AutoWah");
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(effectChain);
    const removed = items.splice(result.source.index, 1);
    if (removed[0]) {
      items.splice(result.destination.index, 0, removed[0]);
      setEffectChain(items);
    }
  };

  const addEffect = () => {
    setEffectChain([...effectChain, createEffectNode(selectedEffect)]);
  };

  const removeEffect = (id: string) => {
    setEffectChain(effectChain.filter((e) => e.id !== id));
  };

  const updateEffect = (id: string, newParams: Partial<EffectParams>, enabled?: boolean) => {
    setEffectChain(
      effectChain.map((e) =>
        e.id === id
          ? {
              ...e,
              enabled: enabled !== undefined ? enabled : e.enabled,
              params: { ...e.params, ...newParams } as EffectParams,
            }
          : e
      )
    );
  };

  const renderEffectParams = (effect: EffectNode) => {
    const { type, params, id } = effect;
    const update = (newParams: Partial<EffectParams>) => updateEffect(id, newParams);

    const renderSlider = (
      label: string,
      field: string,
      min: number,
      max: number,
      step: number,
      val: number,
      displayMultiplier: number = 1
    ) => (
      <div className="flex flex-col gap-1 text-xs">
        <label className="flex justify-between">
          <span className="font-medium">{label}</span>
          <span>{Math.round(val * displayMultiplier)}</span>
        </label>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={val}
          onChange={(e) => update({ [field]: parseFloat(e.target.value) })}
          className="w-full accent-indigo-500"
        />
      </div>
    );

    return (
      <div className="grid grid-cols-2 gap-3 mt-3">
        {renderSlider("Mix", "mix", 0, 1, 0.01, params.mix, 100)}
        
        {type === "Reverb" && (
          <>
            {renderSlider("Decay", "decay", 0.5, 10, 0.1, (params as any).decay)}
            {renderSlider("PreDelay", "preDelay", 0, 0.5, 0.01, (params as any).preDelay)}
          </>
        )}
        {type === "Delay" && (
          <>
            {renderSlider("Time", "delayTime", 0.01, 1, 0.01, (params as any).delayTime)}
            {renderSlider("Feedback", "feedback", 0, 0.9, 0.01, (params as any).feedback, 100)}
          </>
        )}
        {type === "Chorus" && (
          <>
            {renderSlider("Rate", "frequency", 0.1, 10, 0.1, (params as any).frequency)}
            {renderSlider("Depth", "depth", 0, 1, 0.01, (params as any).depth, 100)}
          </>
        )}

        {type === "AutoWah" && (
          <>
            {renderSlider("Base Freq", "baseFrequency", 50, 2000, 10, (params as any).baseFrequency)}
            {renderSlider("Octaves", "octaves", 1, 8, 0.5, (params as any).octaves)}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl bg-black/5 dark:bg-black/20 p-4 rounded-xl backdrop-blur-sm shadow-xl overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Effects Rack</h2>
        <div className="flex gap-2">
          <select
            value={selectedEffect}
            onChange={(e) => setSelectedEffect(e.target.value as EffectType)}
            className="text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
          >
            <option value="AutoWah">AutoWah</option>
            <option value="Chorus">Chorus</option>
            <option value="Delay">Delay</option>
            <option value="Reverb">Reverb</option>
          </select>
          <button
            onClick={addEffect}
            className="bg-indigo-500 hover:bg-indigo-600 text-white p-1 rounded transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="effects-list" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex flex-row gap-4 min-h-[150px] overflow-x-auto pb-4 custom-scrollbar"
            >
              {effectChain.map((effect, index) => (
                <Draggable key={effect.id} draggableId={effect.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`min-w-[260px] w-[260px] shrink-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded-xl shadow-lg border-2 ${
                        snapshot.isDragging ? "border-indigo-400 scale-105" : "border-transparent"
                      } transition-transform duration-200`}
                    >
                      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab hover:text-indigo-500 text-gray-400"
                          >
                            <GripVertical size={18} />
                          </div>
                          <span className="font-semibold">{effect.type}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateEffect(effect.id, {}, !effect.enabled)}
                            className={`text-xs px-2 py-1 rounded font-medium ${
                              effect.enabled
                                ? "bg-green-500/20 text-green-700 dark:text-green-400"
                                : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {effect.enabled ? "ON" : "BYP"}
                          </button>
                          <button
                            onClick={() => removeEffect(effect.id)}
                            className="text-red-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {effect.enabled ? (
                        renderEffectParams(effect)
                      ) : (
                        <div className="text-center text-xs text-gray-500 py-2">
                          Bypassed
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              {effectChain.length === 0 && (
                <div className="w-full flex items-center justify-center text-sm opacity-50 py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                  No effects in chain. Add one from the dropdown above!
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
