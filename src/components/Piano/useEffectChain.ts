"use client";

import { useEffect, useRef } from "react";
import type * as ToneType from "tone";
import type { EffectNode, EffectNodeOf, EffectType } from "@/lib/effects";
import {
  EFFECT_BUILDERS,
  type EffectAdapter,
  type EffectBuilder,
} from "./effectSpecs";

interface ActiveEffect {
  mode: string;
  adapter: EffectAdapter;
}

/**
 * Builds or updates the adapter for one node.
 *
 * Generic over the node's type so its parameters and its entry in
 * `EFFECT_BUILDERS` are checked against the same effect. Returns `null` when
 * the node cannot be built yet, leaving it out of the chain until it can be.
 */
function reconcileNode<T extends EffectType>(
  node: EffectNodeOf<T>,
  existing: ActiveEffect | undefined,
  Tone: typeof ToneType,
  nativeContext: AudioContext,
): ActiveEffect | null {
  // A different mode is a different node topology, so it cannot update in place.
  if (existing && existing.mode === node.params.mode) {
    existing.adapter.update(node.params);
    return existing;
  }
  existing?.adapter.dispose();

  // Indexing by type and then by mode is correlated, which TypeScript checks
  // one step at a time; the table's declared shape guarantees the pairing.
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

/**
 * Routes the sampler through the user's effect chain.
 *
 * Adapters are keyed by node id and reused across renders so that dragging a
 * slider adjusts a live node instead of rebuilding it, which would click.
 *
 * @param sourceRevision - Any value that changes whenever `source.current` is
 *   replaced. The source lives in a ref, so it cannot be a dependency itself;
 *   passing what drives its rebuild keeps the graph wired to the live node.
 * @param contextState - Rebuilds LFO-driven effects that had to be skipped
 *   while the context was still suspended.
 */
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

    // Dispose removed nodes before rebuilding graph connections.
    activeEffectsRef.current.forEach((effect, id) => {
      if (!nextActive.has(id)) effect.adapter.dispose();
    });
    activeEffectsRef.current = nextActive;

    // Clear stale outgoing edges before reconnecting the ordered chain.
    sourceNode.disconnect();
    nextActive.forEach(({ adapter }) => adapter.output.disconnect());

    let currentOutput: ToneType.OutputNode = sourceNode;
    effectChain.forEach((node) => {
      const effect = node.enabled ? nextActive.get(node.id) : undefined;
      if (!effect) return;
      // Tone.connect normalizes native and Tone.js node semantics.
      Tone.connect(currentOutput, effect.adapter.input);
      currentOutput = effect.adapter.output;
    });

    Tone.connect(
      currentOutput,
      limiterRef.current ?? nativeContext.destination,
    );
  }, [Tone, source, sourceRevision, effectChain, limiterRef, contextState]);

  // Read through the ref rather than capturing the map, which is replaced
  // wholesale on every reconcile.
  useEffect(
    () => () => {
      activeEffectsRef.current.forEach((effect) => effect.adapter.dispose());
      activeEffectsRef.current = new Map();
    },
    [],
  );
}
