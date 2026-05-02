import { useEffect, useRef } from 'react';
import { useSynthStore } from '../store/useSynthStore';
import { midiNoteToName } from '../modules/audio/synthCore';
import type { KnobValues, FaderValues } from '../types';

interface MIDIMessageEvent extends Event {
  data: Uint8Array;
}

interface MIDIInput extends EventTarget {
  id: string;
  name: string;
  onmidimessage: ((this: MIDIInput, ev: MIDIMessageEvent) => unknown) | null;
}

interface MIDIInputMap extends Map<string, MIDIInput> {
  values(): IterableIterator<MIDIInput>;
}

interface MIDIAccess extends EventTarget {
  inputs: MIDIInputMap;
  onstatechange: ((this: MIDIAccess, ev: Event) => unknown) | null;
}

type CC_TO_KNOB = Record<number, keyof KnobValues>;
type CC_TO_FADER = Record<number, keyof FaderValues>;

const CC_MAP_KNOBS: CC_TO_KNOB = {
  74: 'cutoff',
  71: 'resonance',
  76: 'lfoRate',
  77: 'lfoDepth',
  75: 'delay',
  72: 'reverb',
  73: 'drive',
  10: 'pan',
};

const CC_MAP_FADERS: CC_TO_FADER = {
  20: 'attack',
  21: 'decay',
  22: 'sustain',
  23: 'release',
};

export function useMidiController(): void {
  const connectedInputsRef = useRef(new Set<string>());

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    const requestMIDIAccess =
      (navigator as unknown as Record<string, unknown>).requestMIDIAccess as
        | (() => Promise<MIDIAccess>)
        | undefined;

    if (!requestMIDIAccess) return;

    let access: MIDIAccess | null = null;
    let cleanup = false;

    const handleMidiMessage = (event: MIDIMessageEvent): void => {
      const data = event.data;
      if (!data || data.length < 3) return;

      const command = data[0]! & 0xf0;
      const data1 = data[1]!;
      const data2 = data[2]!;

      switch (command) {
        case 0x90: {
          if (data2 > 0) {
            useSynthStore.getState().triggerNote(midiNoteToName(data1));
          } else {
            useSynthStore.getState().releaseNote(midiNoteToName(data1));
          }
          break;
        }
        case 0x80: {
          useSynthStore.getState().releaseNote(midiNoteToName(data1));
          break;
        }
        case 0xe0: {
          const pbValue = ((data2 << 7) | data1) / 8192 - 1;
          useSynthStore.getState().setPitchBend(pbValue);
          break;
        }
        case 0xb0: {
          const knobKey = CC_MAP_KNOBS[data1];
          if (knobKey) {
            useSynthStore.getState().setKnob(knobKey, data2 / 127);
            return;
          }
          const faderKey = CC_MAP_FADERS[data1];
          if (faderKey) {
            useSynthStore.getState().setFader(faderKey, data2 / 127);
            return;
          }
          if (data1 === 1) {
            useSynthStore.getState().setModulation(data2 / 127);
          }
          break;
        }
      }
    };

    const connectInput = (input: MIDIInput): void => {
      if (connectedInputsRef.current.has(input.id)) return;
      connectedInputsRef.current.add(input.id);
      input.onmidimessage = handleMidiMessage;
    };

    const disconnectInput = (input: MIDIInput): void => {
      connectedInputsRef.current.delete(input.id);
      input.onmidimessage = null;
    };

    const setup = async (): Promise<void> => {
      try {
        access = await requestMIDIAccess();
        if (cleanup) return;

        for (const input of access.inputs.values()) {
          connectInput(input);
        }

        access.onstatechange = (ev: Event): void => {
          const connectionEvent = ev as Event & { port?: MIDIInput };
          const port = connectionEvent.port;
          if (!port) return;
          if ((port as unknown as { state?: string }).state === 'connected') {
            connectInput(port);
          } else {
            disconnectInput(port);
          }
        };
      } catch (err) {
        console.warn('MIDI access denied or unavailable:', err);
      }
    };

    void setup();

    return () => {
      cleanup = true;
      if (access) {
        access.onstatechange = null;
        for (const input of access.inputs.values()) {
          disconnectInput(input);
        }
      }
    };
  }, []);
}
