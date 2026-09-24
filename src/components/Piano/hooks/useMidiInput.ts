"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { parseMidiMessage } from "@/lib/midi";

export type MidiStatus = "idle" | "connecting" | "connected" | "denied";

export interface MidiHandlers {
  onNoteOn: (midi: number, velocity: number) => void;
  onNoteOff: (midi: number) => void;
  onSustain: (on: boolean) => void;
}

export interface MidiInput {
  supported: boolean;
  status: MidiStatus;
  devices: string[];
  connect: () => void;
}

const subscribeNever = () => () => {};

export function useMidiInput(handlers: MidiHandlers): MidiInput {
  // Assume support on the server so the control does not flash on hydration.
  const supported = useSyncExternalStore(
    subscribeNever,
    () => typeof navigator.requestMIDIAccess === "function",
    () => true,
  );
  const [status, setStatus] = useState<MidiStatus>("idle");
  const [devices, setDevices] = useState<string[]>([]);
  const accessRef = useRef<MIDIAccess | null>(null);

  // Keep device listeners stable while handlers change.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const handleMessage = useCallback((event: MIDIMessageEvent) => {
    const message = parseMidiMessage(event.data);
    if (!message) return;

    const { onNoteOn, onNoteOff, onSustain } = handlersRef.current;
    if (message.type === "noteon") onNoteOn(message.note, message.velocity);
    else if (message.type === "noteoff") onNoteOff(message.note);
    else onSustain(message.on);
  }, []);

  const attach = useCallback(
    (access: MIDIAccess) => {
      accessRef.current = access;
      const syncInputs = () => {
        const names: string[] = [];
        access.inputs.forEach((input) => {
          input.onmidimessage = handleMessage;
          if (input.state === "connected") {
            names.push(input.name?.trim() || "MIDI device");
          }
        });
        setDevices(names);
      };

      access.onstatechange = syncInputs;
      syncInputs();
      setStatus("connected");
    },
    [handleMessage],
  );

  const connect = useCallback(() => {
    if (accessRef.current || typeof navigator.requestMIDIAccess !== "function")
      return;

    setStatus("connecting");
    navigator
      .requestMIDIAccess()
      .then(attach)
      .catch(() => setStatus("denied"));
  }, [attach]);

  // Reconnect silently when the visitor already granted access.
  useEffect(() => {
    if (!supported || !navigator.permissions) return;
    let cancelled = false;

    navigator.permissions
      .query({ name: "midi" as PermissionName })
      .then((permission) => {
        if (!cancelled && permission.state === "granted") connect();
      })
      .catch(() => {
        // Browsers without a MIDI permission entry wait for the button.
      });

    return () => {
      cancelled = true;
    };
  }, [supported, connect]);

  useEffect(
    () => () => {
      const access = accessRef.current;
      if (!access) return;
      access.onstatechange = null;
      access.inputs.forEach((input) => {
        input.onmidimessage = null;
      });
      accessRef.current = null;
    },
    [],
  );

  return { supported, status, devices, connect };
}
