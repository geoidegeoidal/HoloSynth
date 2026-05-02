export interface KnobValues {
  cutoff: number;
  resonance: number;
  lfoRate: number;
  lfoDepth: number;
  delay: number;
  reverb: number;
  drive: number;
  pan: number;
}

export interface FaderValues {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export type LooperState = 'idle' | 'recording' | 'playing' | 'muted';

export interface MinilabState {
  isReady: boolean;
  activeNotes: Set<string>;
  octaveOffset: number;
  pitchBend: number;
  modulation: number;
  knobs: KnobValues;
  faders: FaderValues;
  activePads: Set<number>;
  looperState: LooperState;
  currentNote: string;

  triggerNote: (note: string) => void;
  releaseNote: (note: string) => void;
  releaseAllNotes: () => void;
  triggerPad: (padId: number) => void;
  setKnob: (id: keyof KnobValues, value: number) => void;
  setFader: (id: keyof FaderValues, value: number) => void;
  setPitchBend: (value: number) => void;
  setModulation: (value: number) => void;
  setOctaveOffset: (offset: number) => void;
  setReady: (status: boolean) => void;
  setCurrentNote: (note: string) => void;
  setLooperState: (state: LooperState) => void;
}
