import * as Tone from 'tone';
import { angleToNote } from './synthCore';
import { useHoloStore } from '../../store/useHoloStore';
import type { LeftHandGesture } from '../../types';

/**
 * Evento de nota grabado por el looper.
 */
interface LoopEvent {
  /** Offset en segundos desde el inicio del loop */
  time: number;
  note: string;
  duration: string;
}

type LooperState = 'idle' | 'recording' | 'playing' | 'muted';

const MAX_LOOP_DURATION_S = 8; // ~4 compases a 120bpm
const NOTE_DURATION = '8n';

let looperState: LooperState = 'idle';
let recordBuffer: LoopEvent[] = [];
let recordStartTime = 0;
let loopPart: Tone.Part | null = null;
let previousGesture: LeftHandGesture = 'none';

/**
 * Inicia la grabación del loop. Limpia el buffer anterior si existe.
 */
function startRecording(): void {
  stopPlayback();
  recordBuffer = [];
  recordStartTime = Tone.now();
  looperState = 'recording';

  // Iniciar Transport si no está corriendo
  if (Tone.getTransport().state !== 'started') {
    Tone.getTransport().start();
  }
}

/**
 * Detiene la grabación y comienza la reproducción en loop.
 */
function stopRecordingAndPlay(): void {
  if (recordBuffer.length === 0) {
    looperState = 'idle';
    return;
  }

  const loopDuration = Math.min(
    Tone.now() - recordStartTime,
    MAX_LOOP_DURATION_S,
  );

  // Crear un Part con los eventos grabados
  loopPart = new Tone.Part((time, event: LoopEvent) => {
    const { rightHand } = useHoloStore.getState();
    if (!rightHand.isVisible) return;

    // Reutilizar el synth principal — importar desde synthCore no funciona
    // porque necesitamos los nodos. En su lugar, creamos un synth dedicado al looper.
    loopSynth.triggerAttackRelease(event.note, event.duration, time);
  }, recordBuffer.map(e => [e.time, e] as [number, LoopEvent]));

  loopPart.loop = true;
  loopPart.loopEnd = loopDuration;
  loopPart.start(0);

  looperState = 'playing';
}

/**
 * Detiene la reproducción del loop sin borrar el buffer.
 */
function stopPlayback(): void {
  if (loopPart) {
    loopPart.stop();
    loopPart.dispose();
    loopPart = null;
  }
}

/**
 * Mutea el loop (no lo borra).
 */
function muteLoop(): void {
  if (loopPart) {
    loopPart.mute = true;
  }
  looperState = 'muted';
}

/**
 * Desmutea el loop.
 */
function unmuteLoop(): void {
  if (loopPart) {
    loopPart.mute = false;
  }
  looperState = 'playing';
}

// Synth dedicado para el looper — cadena ligera
let loopSynth: Tone.PolySynth;

/**
 * Inicializa el synth del looper. Llamar después de Tone.start().
 */
export function initLooper(): void {
  loopSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'fatsawtooth',
      spread: 15,
      count: 2,
    },
    envelope: {
      attack: 0.03,
      decay: 0.15,
      sustain: 0.4,
      release: 0.6,
    },
  });

  const filter = new Tone.Filter({
    type: 'lowpass',
    frequency: 3000,
    Q: 1,
  });

  const gain = new Tone.Gain(0.45);

  loopSynth.chain(filter, gain, Tone.getDestination());
}

/**
 * Graba una nota en el buffer del looper si estamos en estado 'recording'.
 * Se invoca desde el tick del AudioEngine cuando cambia la nota activa.
 */
export function recordNote(angle: number): void {
  if (looperState !== 'recording') return;

  const elapsed = Tone.now() - recordStartTime;
  if (elapsed > MAX_LOOP_DURATION_S) {
    // Auto-stop al alcanzar el límite de duración
    stopRecordingAndPlay();
    return;
  }

  recordBuffer.push({
    time: elapsed,
    note: angleToNote(angle),
    duration: NOTE_DURATION,
  });
}

/**
 * Máquina de estados del looper, controlada por gestos de la mano izquierda.
 * Debe invocarse en cada frame del tick del AudioEngine.
 */
export function updateLooper(gesture: LeftHandGesture): void {
  // Solo actuar en transiciones de gesto (edge-triggered)
  if (gesture === previousGesture) return;

  const prev = previousGesture;
  previousGesture = gesture;

  switch (looperState) {
    case 'idle':
      if (gesture === 'pinch') {
        startRecording();
      }
      break;

    case 'recording':
      if (gesture === 'open' || (prev === 'pinch' && gesture !== 'pinch')) {
        stopRecordingAndPlay();
      }
      break;

    case 'playing':
      if (gesture === 'fist') {
        muteLoop();
      } else if (gesture === 'pinch') {
        // Nuevo pinch → re-grabar (sobrescribir loop anterior)
        startRecording();
      }
      break;

    case 'muted':
      if (gesture === 'open') {
        unmuteLoop();
      } else if (gesture === 'pinch') {
        // Re-grabar desde muted
        startRecording();
      }
      break;
  }
}

/**
 * Limpieza total del looper.
 */
export function disposeLooper(): void {
  stopPlayback();
  recordBuffer = [];
  looperState = 'idle';
  previousGesture = 'none';
  if (loopSynth) {
    loopSynth.dispose();
  }
}

/**
 * Expone el estado actual del looper (para debug/UI).
 */
export function getLooperState(): LooperState {
  return looperState;
}
