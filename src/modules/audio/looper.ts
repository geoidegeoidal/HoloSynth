import * as Tone from 'tone';
import { useSynthStore } from '../../store/useSynthStore';
import type { LooperState } from '../../types';

interface LoopEvent {
  time: number;
  note: string;
  duration: string;
}

const MAX_LOOP_DURATION_S = 8;
const NOTE_DURATION = '8n';

let looperState: LooperState = 'idle';
let recordBuffer: LoopEvent[] = [];
let recordStartTime = 0;
let loopPart: Tone.Part | null = null;
let loopSynth: Tone.PolySynth | null = null;
let loopFilter: Tone.Filter | null = null;
let loopGain: Tone.Gain | null = null;
let analyser: Tone.Analyser | null = null;

export function initLooper(): void {
  loopSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth', spread: 15, count: 2 },
    envelope: { attack: 0.03, decay: 0.15, sustain: 0.4, release: 0.6 },
  });

  loopFilter = new Tone.Filter({ type: 'lowpass', frequency: 3000, Q: 1 });
  loopGain = new Tone.Gain(0.45);
  analyser = new Tone.Analyser('waveform', 256);

  loopSynth.chain(loopFilter, loopGain, analyser, Tone.getDestination());
}

function startRecording(): void {
  stopPlayback();
  recordBuffer = [];
  recordStartTime = Tone.now();
  looperState = 'recording';
  useSynthStore.getState().setLooperState('recording');

  if (Tone.getTransport().state !== 'started') {
    Tone.getTransport().start();
  }
}

function stopRecordingAndPlay(): void {
  if (recordBuffer.length === 0) {
    looperState = 'idle';
    useSynthStore.getState().setLooperState('idle');
    return;
  }

  const loopDuration = Math.min(
    Tone.now() - recordStartTime,
    MAX_LOOP_DURATION_S,
  );

  if (!loopSynth) {
    looperState = 'idle';
    useSynthStore.getState().setLooperState('idle');
    return;
  }

  loopPart = new Tone.Part((time, event: LoopEvent) => {
    loopSynth?.triggerAttackRelease(event.note, event.duration, time);
  }, recordBuffer.map(e => [e.time, e] as [number, LoopEvent]));

  loopPart.loop = true;
  loopPart.loopEnd = loopDuration;
  loopPart.start(0);

  looperState = 'playing';
  useSynthStore.getState().setLooperState('playing');
}

function stopPlayback(): void {
  if (loopPart) {
    loopPart.stop();
    loopPart.dispose();
    loopPart = null;
  }
}

function muteLoop(): void {
  if (loopPart) {
    loopPart.mute = true;
  }
  looperState = 'muted';
  useSynthStore.getState().setLooperState('muted');
}

function unmuteLoop(): void {
  if (loopPart) {
    loopPart.mute = false;
  }
  looperState = 'playing';
  useSynthStore.getState().setLooperState('playing');
}

export function recordCurrentNote(): void {
  if (looperState !== 'recording') return;

  const note = useSynthStore.getState().currentNote;
  if (!note) return;

  const elapsed = Tone.now() - recordStartTime;
  if (elapsed > MAX_LOOP_DURATION_S) {
    stopRecordingAndPlay();
    return;
  }

  recordBuffer.push({
    time: elapsed,
    note,
    duration: NOTE_DURATION,
  });
}

export function updateLooperWaveform(): void {
  const state = useSynthStore.getState();

  if (state.looperState === 'recording' && state.currentNote) {
    recordCurrentNote();
  }

  if (looperState !== state.looperState) {
    looperState = state.looperState;
  }
}

export function toggleRecord(): void {
  if (looperState === 'idle') {
    startRecording();
  } else if (looperState === 'recording') {
    stopRecordingAndPlay();
  }
}

export function toggleMute(): void {
  if (looperState === 'playing') {
    muteLoop();
  } else if (looperState === 'muted') {
    unmuteLoop();
  }
}

export function clearLoop(): void {
  stopPlayback();
  recordBuffer = [];
  looperState = 'idle';
  useSynthStore.getState().setLooperState('idle');
}

export function getLooperState(): LooperState {
  return looperState;
}

export function getWaveformData(): Float32Array {
  if (!analyser) return new Float32Array(0);
  return analyser.getValue() as Float32Array;
}

export function getRecordBuffer(): LoopEvent[] {
  return recordBuffer;
}

export function getLoopDuration(): number {
  if (recordBuffer.length === 0) return 0;
  return Math.min(recordBuffer[recordBuffer.length - 1]!.time, MAX_LOOP_DURATION_S);
}

export function disposeLooper(): void {
  stopPlayback();
  recordBuffer = [];
  looperState = 'idle';
  useSynthStore.getState().setLooperState('idle');
  if (loopSynth) {
    loopSynth.dispose();
    loopSynth = null;
  }
  if (loopFilter) {
    loopFilter.dispose();
    loopFilter = null;
  }
  if (loopGain) {
    loopGain.dispose();
    loopGain = null;
  }
  if (analyser) {
    analyser.dispose();
    analyser = null;
  }
}
