import * as Tone from 'tone';
import { angleToNote } from './synthCore';
import { useHoloStore } from '../../store/useHoloStore';
import type { LooperState } from '../../types';
import type { LeftHandGesture } from '../../types';

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
let previousGesture: LeftHandGesture = 'none';
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
  useHoloStore.getState().setLooperState('recording');

  if (Tone.getTransport().state !== 'started') {
    Tone.getTransport().start();
  }
}

function stopRecordingAndPlay(): void {
  if (recordBuffer.length === 0) {
    looperState = 'idle';
    useHoloStore.getState().setLooperState('idle');
    return;
  }

  const loopDuration = Math.min(
    Tone.now() - recordStartTime,
    MAX_LOOP_DURATION_S,
  );

  if (!loopSynth) {
    looperState = 'idle';
    useHoloStore.getState().setLooperState('idle');
    return;
  }

  loopPart = new Tone.Part((time, event: LoopEvent) => {
    loopSynth?.triggerAttackRelease(event.note, event.duration, time);
  }, recordBuffer.map(e => [e.time, e] as [number, LoopEvent]));

  loopPart.loop = true;
  loopPart.loopEnd = loopDuration;
  loopPart.start(0);

  looperState = 'playing';
  useHoloStore.getState().setLooperState('playing');
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
  useHoloStore.getState().setLooperState('muted');
}

function unmuteLoop(): void {
  if (loopPart) {
    loopPart.mute = false;
  }
  looperState = 'playing';
  useHoloStore.getState().setLooperState('playing');
}

export function recordNote(angle: number): void {
  if (looperState !== 'recording') return;

  const elapsed = Tone.now() - recordStartTime;
  if (elapsed > MAX_LOOP_DURATION_S) {
    stopRecordingAndPlay();
    return;
  }

  recordBuffer.push({
    time: elapsed,
    note: angleToNote(angle),
    duration: NOTE_DURATION,
  });
}

export function updateLooper(gesture: LeftHandGesture): void {
  if (gesture === previousGesture) return;

  const prev = previousGesture;
  previousGesture = gesture;

  switch (looperState) {
    case 'idle':
      if (gesture === 'pinch') startRecording();
      break;
    case 'recording':
      if (gesture === 'open' || (prev === 'pinch' && gesture !== 'pinch')) stopRecordingAndPlay();
      break;
    case 'playing':
      if (gesture === 'fist') muteLoop();
      else if (gesture === 'pinch') startRecording();
      break;
    case 'muted':
      if (gesture === 'open') unmuteLoop();
      else if (gesture === 'pinch') startRecording();
      break;
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
  useHoloStore.getState().setLooperState('idle');
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
  previousGesture = 'none';
  useHoloStore.getState().setLooperState('idle');
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