import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { MinilabState, KnobValues, FaderValues, LooperState } from '../types';

const DEFAULT_KNOBS: KnobValues = {
  cutoff: 0.5,
  resonance: 0.3,
  lfoRate: 0.3,
  lfoDepth: 0.1,
  delay: 0.25,
  reverb: 0.4,
  drive: 0.15,
  pan: 0.5,
};

const DEFAULT_FADERS: FaderValues = {
  attack: 0.08,
  decay: 0.3,
  sustain: 0.5,
  release: 1.2,
};

export const useSynthStore = create<MinilabState>()(
  subscribeWithSelector((set) => ({
  isReady: false,
  activeNotes: new Set<string>(),
  octaveOffset: 0,
  pitchBend: 0,
  modulation: 0,
  knobs: { ...DEFAULT_KNOBS },
  faders: { ...DEFAULT_FADERS },
  activePads: new Set<number>(),
  looperState: 'idle' as LooperState,
  currentNote: '',

  triggerNote: (note) =>
    set((state) => {
      const next = new Set(state.activeNotes);
      next.add(note);
      return { activeNotes: next, currentNote: note };
    }),

  releaseNote: (note) =>
    set((state) => {
      const next = new Set(state.activeNotes);
      next.delete(note);
      const remaining = [...next];
      return {
        activeNotes: next,
        currentNote: remaining.length > 0 ? (remaining[remaining.length - 1] ?? '') : '',
      };
    }),

  releaseAllNotes: () => set({ activeNotes: new Set<string>(), currentNote: '' }),

  triggerPad: (padId) =>
    set((state) => {
      const next = new Set(state.activePads);
      if (next.has(padId)) {
        next.delete(padId);
      } else {
        next.add(padId);
      }
      return { activePads: next };
    }),

  setKnob: (id, value) =>
    set((state) => ({
      knobs: { ...state.knobs, [id]: Math.max(0, Math.min(1, value)) },
    })),

  setFader: (id, value) =>
    set((state) => ({
      faders: { ...state.faders, [id]: Math.max(0, Math.min(1, value)) },
    })),

  setPitchBend: (value) =>
    set({ pitchBend: Math.max(-1, Math.min(1, value)) }),

  setModulation: (value) =>
    set({ modulation: Math.max(0, Math.min(1, value)) }),

  setOctaveOffset: (offset) =>
    set({ octaveOffset: Math.max(-3, Math.min(3, offset)) }),

  setReady: (status) => set({ isReady: status }),

  setCurrentNote: (note) => set({ currentNote: note }),

  setLooperState: (state) => set({ looperState: state }),
})));

export const useIsReady = () => useSynthStore((s) => s.isReady);
export const useCurrentNote = () => useSynthStore((s) => s.currentNote);
export const useLooperState = () => useSynthStore((s) => s.looperState);
export const useActiveNotes = () => useSynthStore((s) => s.activeNotes);
export const useActivePads = () => useSynthStore((s) => s.activePads);
export const useOctaveOffset = () => useSynthStore((s) => s.octaveOffset);
export const usePitchBend = () => useSynthStore((s) => s.pitchBend);
export const useModulation = () => useSynthStore((s) => s.modulation);

export const useKnob = (id: keyof KnobValues) =>
  useSynthStore((s) => s.knobs[id]);
export const useKnobs = () => useSynthStore((s) => s.knobs);
export const useFader = (id: keyof FaderValues) =>
  useSynthStore((s) => s.faders[id]);
export const useFaders = () => useSynthStore((s) => s.faders);
