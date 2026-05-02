import * as Tone from 'tone';

// Escala pentatónica menor C3–C5 (11 notas)
const SCALE: readonly string[] = [
  'C3', 'Eb3', 'F3', 'G3', 'Bb3',
  'C4', 'Eb4', 'F4', 'G4', 'Bb4',
  'C5',
] as const;

const MIN_FILTER_FREQ = 200;
const MAX_FILTER_FREQ = 8000;

export interface SynthNodes {
  synth: Tone.PolySynth;
  filter: Tone.Filter;
  distortion: Tone.Distortion;
  reverb: Tone.Reverb;
  gain: Tone.Gain;
}

let nodes: SynthNodes | null = null;
let currentNote: string | null = null;

/**
 * Construye el grafo de audio:
 * PolySynth → Filter (LPF) → Distortion (sutil) → Reverb → Gain (VCA) → Destination
 */
export function createSynthChain(): SynthNodes {
  if (nodes) return nodes;

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'fatsawtooth',
      spread: 20,
      count: 3,
    },
    envelope: {
      attack: 0.05,
      decay: 0.2,
      sustain: 0.6,
      release: 0.8,
    },
  });

  const filter = new Tone.Filter({
    type: 'lowpass',
    frequency: MIN_FILTER_FREQ,
    rolloff: -24,
    Q: 2,
  });

  const distortion = new Tone.Distortion({
    distortion: 0.15,
    wet: 0.3,
  });

  const reverb = new Tone.Reverb({
    decay: 3,
    wet: 0.35,
  });

  const gain = new Tone.Gain(0);

  synth.chain(filter, distortion, reverb, gain, Tone.getDestination());

  nodes = { synth, filter, distortion, reverb, gain };
  return nodes;
}

/**
 * Cuantiza `angle` (0–360°) a un índice de la escala pentatónica.
 */
export function angleToNote(angle: number): string {
  const idx = Math.floor((angle / 360) * SCALE.length) % SCALE.length;
  return SCALE[idx]!;
}

/**
 * Mapea `radius` (0–1) a frecuencia de corte del LPF (escala exponencial).
 * 0 → 200 Hz, 1 → 8000 Hz
 */
export function radiusToFilterFreq(radius: number): number {
  return MIN_FILTER_FREQ * Math.pow(MAX_FILTER_FREQ / MIN_FILTER_FREQ, radius);
}

/**
 * Actualiza los parámetros del synth en función de los datos del store.
 * Se invoca a ~30fps desde el componente AudioEngine.
 */
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

/**
 * Libera todas las notas activas — seguridad ante desmontaje.
 */
export function releaseAll(): void {
  if (!nodes) return;
  nodes.synth.releaseAll();
  currentNote = null;
}

/**
 * Destruye el grafo de audio por completo.
 */
export function disposeSynthChain(): void {
  if (!nodes) return;
  releaseAll();
  nodes.synth.dispose();
  nodes.filter.dispose();
  nodes.distortion.dispose();
  nodes.reverb.dispose();
  nodes.gain.dispose();
  nodes = null;
}
