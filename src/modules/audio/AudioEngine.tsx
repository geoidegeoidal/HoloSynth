import React, { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import {
  createSynthChain,
  updateSynthParams,
  disposeSynthChain,
  angleToNote,
} from './synthCore';
import { initLooper, recordNote, updateLooper, disposeLooper } from './looper';
import { useHoloStore } from '../../store/useHoloStore';

/**
 * AudioEngine — componente headless que conecta el store de Zustand
 * con el grafo de audio de Tone.js y el sistema de looper.
 *
 * Maneja el `Tone.start()` al primer clic del usuario para cumplir
 * con las políticas de autoplay del navegador.
 */
export const AudioEngine: React.FC = () => {
  const audioStartedRef = useRef(false);
  const rafIdRef = useRef<number>(0);
  const prevNoteRef = useRef<string | null>(null);

  const startAudioContext = useCallback(async () => {
    if (audioStartedRef.current) return;
    try {
      await Tone.start();
      createSynthChain();
      initLooper();
      audioStartedRef.current = true;

      // Loop de actualización fuera del ciclo de React
      const tick = () => {
        const { rightHand, leftHandGesture } = useHoloStore.getState();
        updateSynthParams(rightHand.angle, rightHand.radius, rightHand.isVisible);

        // Grabar nota en el looper cuando cambia
        if (rightHand.isVisible) {
          const currentNote = angleToNote(rightHand.angle);
          if (currentNote !== prevNoteRef.current) {
            recordNote(rightHand.angle);
            prevNoteRef.current = currentNote;
          }
        } else {
          prevNoteRef.current = null;
        }

        // Actualizar máquina de estados del looper
        updateLooper(leftHandGesture);

        rafIdRef.current = requestAnimationFrame(tick);
      };
      rafIdRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.error('Error starting audio context:', err);
    }
  }, []);

  useEffect(() => {
    // Registrar listener global para el primer gesto del usuario
    const handler = () => {
      void startAudioContext();
      window.removeEventListener('click', handler);
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('keydown', handler);
    };

    window.addEventListener('click', handler);
    window.addEventListener('touchstart', handler);
    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('touchstart', handler);
      window.removeEventListener('keydown', handler);
      cancelAnimationFrame(rafIdRef.current);
      disposeLooper();
      disposeSynthChain();
    };
  }, [startAudioContext]);

  return null;
};

