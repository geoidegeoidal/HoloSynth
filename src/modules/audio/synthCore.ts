import * as Tone from 'tone';
import type { KnobValues, FaderValues } from '../../types';

export const SCALE: readonly string[] = [
  'C3', 'D3', 'Eb3', 'F3', 'G3', 'A3', 'Bb3',
  'C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4',
  'C5',
] as const;

const MIN_FILTER_FREQ = 100;
const MAX_FILTER_FREQ = 8000;

export interface SynthNodes {
  synth: Tone.PolySynth;
  filter: Tone.Filter;
  distortion: Tone.Distortion;
  delay: Tone.PingPongDelay;
  reverb: Tone.Reverb;
  gain: Tone.Gain;
  lfo: Tone.LFO;
}

let nodes: SynthNodes | null = null;

export function createSynthChain(): SynthNodes {
  if (nodes) return nodes;

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'fatsawtooth',
      spread: 20,
      count: 3,
    },
    envelope: {
      attack: 0.08,
      decay: 0.3,
      sustain: 0.5,
      release: 1.2,
    },
  });

  synth.set({ portamento: 0.15 });

  const filter = new Tone.Filter({
    type: 'lowpass',
    frequency: MIN_FILTER_FREQ,
    rolloff: -24,
    Q: 3,
  });

  const lfo = new Tone.LFO({
    type: 'sine',
    min: MIN_FILTER_FREQ,
    max: MIN_FILTER_FREQ + 1000,
    frequency: 2,
  });
  lfo.connect(filter.frequency);
  lfo.start();

  const distortion = new Tone.Distortion({
    distortion: 0.12,
    wet: 0.2,
  });

  const delay = new Tone.PingPongDelay({
    delayTime: '8n',
    feedback: 0.35,
    wet: 0.25,
  });

  const reverb = new Tone.Reverb({
    decay: 5,
    wet: 0.45,
  });

  const gain = new Tone.Gain(0.8);

  synth.chain(filter, distortion, delay, reverb, gain, Tone.getDestination());

  nodes = { synth, filter, distortion, delay, reverb, gain, lfo };
  return nodes;
}

export function getSynthNodes(): SynthNodes | null {
  return nodes;
}

export function triggerSynthNote(note: string, velocity = 1.0): void {
  if (!nodes) return;
  nodes.synth.triggerAttack(note, Tone.now(), velocity);
}

export function releaseSynthNote(note: string): void {
  if (!nodes) return;
  nodes.synth.triggerRelease(note, Tone.now());
}

export function releaseAllSynthNotes(): void {
  if (!nodes) return;
  nodes.synth.releaseAll();
}

export function updateKnobParams(knobs: KnobValues): void {
  if (!nodes) return;

  const freq = MIN_FILTER_FREQ * Math.pow(MAX_FILTER_FREQ / MIN_FILTER_FREQ, knobs.cutoff);
  nodes.filter.frequency.rampTo(freq, 0.05);
  nodes.filter.set({ Q: 0.5 + knobs.resonance * 15 });

  nodes.lfo.frequency.rampTo(0.1 + knobs.lfoRate * 15, 0.05);
  nodes.lfo.set({
    min: MIN_FILTER_FREQ,
    max: MIN_FILTER_FREQ + knobs.lfoDepth * 5000,
  });

  nodes.distortion.set({
    distortion: knobs.drive * 1.5,
    wet: knobs.drive * 0.8,
  });

  nodes.delay.set({
    wet: knobs.delay,
  });

  nodes.reverb.set({
    wet: knobs.reverb * 0.8,
    decay: 0.5 + knobs.reverb * 10,
  });

  nodes.gain.gain.rampTo(0.3 + knobs.pan * 0.7, 0.05);
}

export function updateFaderParams(faders: FaderValues): void {
  if (!nodes) return;

  nodes.synth.set({
    envelope: {
      attack: faders.attack * 3,
      decay: faders.decay * 2,
      sustain: faders.sustain,
      release: faders.release * 4,
    },
  });
}

export function updatePitchBend(value: number): void {
  if (!nodes) return;
  nodes.synth.set({ detune: value * 200 });
}

export function disposeSynthChain(): void {
  if (!nodes) return;
  releaseAllSynthNotes();
  nodes.lfo.stop();
  nodes.lfo.dispose();
  nodes.synth.dispose();
  nodes.filter.dispose();
  nodes.distortion.dispose();
  nodes.delay.dispose();
  nodes.reverb.dispose();
  nodes.gain.dispose();
  nodes = null;
}

export function midiNoteToName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = noteNames[midi % 12];
  return `${note}${octave}`;
}
