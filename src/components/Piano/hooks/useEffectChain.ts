"use client";

import { useEffect, useRef } from "react";
import type * as ToneType from "tone";
import type { EffectNode, EffectNodeOf, EffectType } from "@/lib/effects";
import {
  EFFECT_BUILDERS,
  type EffectAdapter,
  type EffectBuilder,
} from "@/lib/audio/effectSpecs";

interface ActiveEffect {
  mode: string;
  adapter: EffectAdapter;
}

function reconcileNode<T extends EffectType>(
  node: EffectNodeOf<T>,
  existing: ActiveEffect | undefined,
  Tone: typeof ToneType,
  nativeContext: AudioContext,
): ActiveEffect | null {
  if (existing && existing.mode === node.params.mode) {
    existing.adapter.update(node.params);
    return existing;
  }
  existing?.adapter.dispose();

  // TypeScript cannot infer the correlation between effect type and mode.
  const builders = EFFECT_BUILDERS[node.type] as Record<
    string,
    EffectBuilder<T> | undefined
  >;
  const builder = builders[node.params.mode];
  if (!builder) return null;

  if (builder.requiresRunningContext && Tone.getContext().state !== "running") {
    return null;
  }

  return {
    mode: node.params.mode,
    adapter: builder.create({ Tone, nativeContext }, node.params),
  };
}

// Reconcile when the source ref changes or the audio context unlocks.
export function useEffectChain(
  Tone: typeof ToneType | null,
  source: React.RefObject<ToneType.ToneAudioNode | null>,
  sourceRevision: unknown,
  effectChain: EffectNode[],
  limiterRef: React.RefObject<ToneType.Limiter | null>,
  contextState: AudioContextState,
) {
  const activeEffectsRef = useRef<Map<string, ActiveEffect>>(new Map());

  useEffect(() => {
    const sourceNode = source.current;
    if (!Tone || !sourceNode) return;
    const nativeContext = Tone.getContext().rawContext as AudioContext;

    const nextActive = new Map<string, ActiveEffect>();
    effectChain.forEach((node) => {
      const effect = reconcileNode(
        node,
        activeEffectsRef.current.get(node.id),
        Tone,
        nativeContext,
      );
      if (effect) nextActive.set(node.id, effect);
    });

    activeEffectsRef.current.forEach((effect, id) => {
      if (!nextActive.has(id)) effect.adapter.dispose();
    });
    activeEffectsRef.current = nextActive;

    sourceNode.disconnect();
    nextActive.forEach(({ adapter }) => adapter.output.disconnect());

    let currentOutput: ToneType.OutputNode = sourceNode;
    effectChain.forEach((node) => {
      const effect = node.enabled ? nextActive.get(node.id) : undefined;
      if (!effect) return;
      Tone.connect(currentOutput, effect.adapter.input);
      currentOutput = effect.adapter.output;
    });

    Tone.connect(
      currentOutput,
      limiterRef.current ?? nativeContext.destination,
    );
  }, [Tone, source, sourceRevision, effectChain, limiterRef, contextState]);

  useEffect(
    () => () => {
      activeEffectsRef.current.forEach((effect) => effect.adapter.dispose());
      activeEffectsRef.current = new Map();
    },
    [],
  );
}
