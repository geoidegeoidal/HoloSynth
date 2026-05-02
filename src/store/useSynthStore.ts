import { create } from 'zustand';
import type { LooperState } from '../types';

export interface MinilabState {
  // Keyboard State
  activeNotes: Set<string>;
  octaveOffset: number;
  pitchBend: number;
  modulation: number;

  // Physical/Virtual Controls
  knobs: {
    cutoff: number;
    resonance: number;
    lfoRate: number;
    lfoDepth: number;
    delay: number;
    reverb: number;
    drive: number;
    pan: number;
  };

  faders: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };

  activePads: Set<number>;

  // UI state
  isReady: boolean;
  currentNote: string;
  looperState: LooperState;

  // Actions
  triggerNote: (note: string, velocity?: number) => void;
  releaseNote: (note: string) => void;
  triggerPad: (padId: number) => void;
  releasePad: (padId: number) => void;
  setKnob: (id: keyof MinilabState['knobs'], val: number) => void;
  setFader: (id: keyof MinilabState['faders'], val: number) => void;
  setPitchBend: (val: number) => void;
  setModulation: (val: number) => void;
  setOctaveOffset: (val: number) => void;
  setReady: (val: boolean) => void;
  setCurrentNote: (val: string) => void;
  setLooperState: (val: LooperState) => void;
}

export const useSynthStore = create<MinilabState>((set) => ({
  activeNotes: new Set(),
  octaveOffset: 0,
  pitchBend: 0,
  modulation: 0,

  knobs: {
    cutoff: 0.8,
    resonance: 0.2,
    lfoRate: 0.5,
    lfoDepth: 0.0,
    delay: 0.1,
    reverb: 0.2,
    drive: 0.0,
    pan: 0.0,
  },

  faders: {
    attack: 0.05,
    decay: 0.2,
    sustain: 0.8,
    release: 0.3,
  },

  activePads: new Set(),

  isReady: false,
  currentNote: '',
  looperState: 'idle' as LooperState,

  triggerNote: (note) => set((state) => {
    const newNotes = new Set(state.activeNotes);
    newNotes.add(note);
    return { activeNotes: newNotes, currentNote: note };
  }),

  releaseNote: (note) => set((state) => {
    const newNotes = new Set(state.activeNotes);
    newNotes.delete(note);
    const remaining = [...newNotes];
    return {
      activeNotes: newNotes,
      currentNote: remaining.length > 0 ? (remaining[remaining.length - 1] ?? '') : '',
    };
  }),

  triggerPad: (padId) => set((state) => {
    const newPads = new Set(state.activePads);
    newPads.add(padId);
    return { activePads: newPads };
  }),

  releasePad: (padId) => set((state) => {
    const newPads = new Set(state.activePads);
    newPads.delete(padId);
    return { activePads: newPads };
  }),

  setKnob: (id, val) => set((state) => ({
    knobs: { ...state.knobs, [id]: Math.max(0, Math.min(1, val)) }
  })),

  setFader: (id, val) => set((state) => ({
    faders: { ...state.faders, [id]: Math.max(0, Math.min(1, val)) }
  })),

  setPitchBend: (val) => set({ pitchBend: Math.max(-1, Math.min(1, val)) }),

  setModulation: (val) => set({ modulation: Math.max(0, Math.min(1, val)) }),

  setOctaveOffset: (val) => set({ octaveOffset: Math.max(-3, Math.min(3, val)) }),

  setReady: (val) => set({ isReady: val }),

  setCurrentNote: (val) => set({ currentNote: val }),

  setLooperState: (val) => set({ looperState: val }),
}));

export const useIsReady = () => useSynthStore((s) => s.isReady);
export const useCurrentNote = () => useSynthStore((s) => s.currentNote);
export const useLooperState = () => useSynthStore((s) => s.looperState);
export const useActiveNotes = () => useSynthStore((s) => s.activeNotes);
export const useActivePads = () => useSynthStore((s) => s.activePads);
export const useOctaveOffset = () => useSynthStore((s) => s.octaveOffset);
export const usePitchBend = () => useSynthStore((s) => s.pitchBend);
export const useModulation = () => useSynthStore((s) => s.modulation);
export const useKnobs = () => useSynthStore((s) => s.knobs);
export const useFaders = () => useSynthStore((s) => s.faders);
