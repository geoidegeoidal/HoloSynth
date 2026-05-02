import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import {
  createSynthChain,
  triggerSynthNote,
  releaseSynthNote,
  releaseAllSynthNotes,
  updateKnobParams,
  updateFaderParams,
  updatePitchBend,
  disposeSynthChain,
} from './synthCore';
import { initLooper, toggleRecord, toggleMute, clearLoop, disposeLooper, updateLooperWaveform } from './looper';
import { useSynthStore } from '../../store/useSynthStore';

export const AudioEngine: React.FC = () => {
  const audioStartedRef = useRef(false);
  const prevNotesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const startHandler = () => {
      if (audioStartedRef.current) return;
      Tone.start()
        .then(() => {
          createSynthChain();
          initLooper();
          audioStartedRef.current = true;
          useSynthStore.getState().setReady(true);
        })
        .catch((err) => {
          console.error('Error starting audio context:', err);
        });

      window.removeEventListener('click', startHandler);
      window.removeEventListener('touchstart', startHandler);
      window.removeEventListener('keydown', startHandler);
    };

    window.addEventListener('click', startHandler);
    window.addEventListener('touchstart', startHandler);
    window.addEventListener('keydown', startHandler);

    const keyHandler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleRecord();
      } else if (e.code === 'KeyM') {
        toggleMute();
      } else if (e.code === 'KeyC') {
        clearLoop();
      }
    };

    window.addEventListener('keydown', keyHandler);

    refreshWaveform();

    // Subscribe to activeNotes changes for note triggering
    const unsubNotes = useSynthStore.subscribe(
      (state) => state.activeNotes,
      (activeNotes) => {
        const prevNotes = prevNotesRef.current;

        for (const note of activeNotes) {
          if (!prevNotes.has(note)) {
            triggerSynthNote(note);
          }
        }

        for (const note of prevNotes) {
          if (!activeNotes.has(note)) {
            releaseSynthNote(note);
          }
        }

        prevNotesRef.current = new Set(activeNotes);
      },
    );

    // Subscribe to knob changes
    const unsubKnobs = useSynthStore.subscribe(
      (state) => state.knobs,
      (knobs) => updateKnobParams(knobs),
    );

    // Subscribe to fader changes
    const unsubFaders = useSynthStore.subscribe(
      (state) => state.faders,
      (faders) => updateFaderParams(faders),
    );

    // Subscribe to pitch bend changes
    const unsubPitchBend = useSynthStore.subscribe(
      (state) => state.pitchBend,
      (pitchBend) => updatePitchBend(pitchBend),
    );

    return () => {
      window.removeEventListener('click', startHandler);
      window.removeEventListener('touchstart', startHandler);
      window.removeEventListener('keydown', startHandler);
      window.removeEventListener('keydown', keyHandler);

      unsubNotes();
      unsubKnobs();
      unsubFaders();
      unsubPitchBend();

      releaseAllSynthNotes();
      disposeLooper();
      disposeSynthChain();
      audioStartedRef.current = false;
    };
  }, []);

  return null;
};

let waveformRafId = 0;

function refreshWaveform() {
  cancelAnimationFrame(waveformRafId);
  const tick = () => {
    updateLooperWaveform();
    waveformRafId = requestAnimationFrame(tick);
  };
  waveformRafId = requestAnimationFrame(tick);
}
