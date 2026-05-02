import React, { useEffect, useState } from 'react';
import { engine } from './minilabEngine';
import { drumMachine } from './drumMachine';
import { useSynthStore } from '../../store/useSynthStore';

/**
 * AudioEngine — Componente sin UI que inicializa y gestiona el contexto de Audio.
 * El motor DSP en sí (Tone.js) reacciona mediante suscripciones a Zustand.
 */
export const AudioEngine: React.FC = () => {
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Auto-init on first interaction
  useEffect(() => {
    const initAudio = async () => {
      if (!isAudioReady) {
        await engine.initialize();
        await drumMachine.initialize();
        setIsAudioReady(true);
        useSynthStore.getState().setReady(true);
      }
    };

    window.addEventListener('mousedown', initAudio);
    window.addEventListener('keydown', initAudio);

    return () => {
      window.removeEventListener('mousedown', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, [isAudioReady]);

  // Hook activeNotes back to synthEngine
  // (We do it here to avoid subscribing to Sets inside the vanilla TS engine class which is tricky)
  useEffect(() => {
    const unsubscribe = useSynthStore.subscribe((state, prevState) => {
      // Find new notes
      for (const note of state.activeNotes) {
        if (!prevState.activeNotes.has(note)) {
          engine.triggerAttack(note);
        }
      }
      // Find released notes
      for (const note of prevState.activeNotes) {
        if (!state.activeNotes.has(note)) {
          engine.triggerRelease(note);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
};
