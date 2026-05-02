import React, { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import {
  createSynthChain,
  updateSynthParams,
  disposeSynthChain,
} from './synthCore';
import { useHoloStore } from '../../store/useHoloStore';

/**
 * AudioEngine — componente headless que conecta el store de Zustand
 * con el grafo de audio de Tone.js. No renderiza UI visible.
 *
 * Maneja el `Tone.start()` al primer clic del usuario para cumplir
 * con las políticas de autoplay del navegador.
 */
export const AudioEngine: React.FC = () => {
  const audioStartedRef = useRef(false);
  const rafIdRef = useRef<number>(0);

  const startAudioContext = useCallback(async () => {
    if (audioStartedRef.current) return;
    try {
      await Tone.start();
      createSynthChain();
      audioStartedRef.current = true;

      // Loop de actualización fuera del ciclo de React
      const tick = () => {
        const { rightHand } = useHoloStore.getState();
        updateSynthParams(rightHand.angle, rightHand.radius, rightHand.isVisible);
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
      disposeSynthChain();
    };
  }, [startAudioContext]);

  return null;
};
