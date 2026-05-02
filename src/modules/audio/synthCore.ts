import * as Tone from 'tone';

const SCALE: readonly string[] = [
  'C3', 'D3', 'Eb3', 'F3', 'G3', 'A3', 'Bb3',
  'C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4',
  'C5',
] as const;

const MIN_FILTER_FREQ = 200;
const MAX_FILTER_FREQ = 8000;

export interface SynthNodes {
  synth: Tone.PolySynth;
  filter: Tone.Filter;
  distortion: Tone.Distortion;
  delay: Tone.PingPongDelay;
  reverb: Tone.Reverb;
  gain: Tone.Gain;
}

let nodes: SynthNodes | null = null;
let currentNote: string | null = null;

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

  const gain = new Tone.Gain(0);

  synth.chain(filter, distortion, delay, reverb, gain, Tone.getDestination());

  nodes = { synth, filter, distortion, delay, reverb, gain };
  return nodes;
}

export function angleToNote(angle: number): string {
  const idx = Math.floor((angle / 360) * SCALE.length) % SCALE.length;
  return SCALE[idx]!;
}

export function radiusToFilterFreq(radius: number): number {
  return MIN_FILTER_FREQ * Math.pow(MAX_FILTER_FREQ / MIN_FILTER_FREQ, radius);
}

export function updateSynthParams(
  angle: number,
  radius: number,
  isVisible: boolean,
): void {
  if (!nodes) return;

  const targetGain = isVisible ? Math.pow(radius, 1.5) : 0;
  nodes.gain.gain.rampTo(targetGain, 0.08);

  nodes.filter.frequency.rampTo(radiusToFilterFreq(radius), 0.08);

  const note = angleToNote(angle);

  if (isVisible && note !== currentNote) {
    if (currentNote) {
      nodes.synth.triggerRelease(currentNote, Tone.now());
    }
    nodes.synth.triggerAttack(note, Tone.now());
    currentNote = note;
  }

  if (!isVisible && currentNote) {
    nodes.synth.triggerRelease(currentNote, Tone.now());
    currentNote = null;
  }
}

export function releaseAll(): void {
  if (!nodes) return;
  nodes.synth.releaseAll();
  currentNote = null;
}

export function disposeSynthChain(): void {
  if (!nodes) return;
  releaseAll();
  nodes.synth.dispose();
  nodes.filter.dispose();
  nodes.distortion.dispose();
  nodes.delay.dispose();
  nodes.reverb.dispose();
  nodes.gain.dispose();
  nodes = null;
}

export { SCALE };