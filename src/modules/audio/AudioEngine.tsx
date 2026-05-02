import React, { useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import {
  createSynthChain,
  updateSynthParams,
  disposeSynthChain,
  angleToNote,
} from './synthCore';
import { initLooper, recordNote, updateLooper, disposeLooper, toggleRecord, toggleMute, clearLoop } from './looper';
import { useHoloStore } from '../../store/useHoloStore';

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

      const tick = () => {
        const { rightHand, leftHandGesture } = useHoloStore.getState();
        updateSynthParams(rightHand.angle, rightHand.radius, rightHand.isVisible);

        const note = rightHand.isVisible ? angleToNote(rightHand.angle) : '';
        useHoloStore.getState().setCurrentNote(note);

        if (rightHand.isVisible) {
          if (note !== prevNoteRef.current) {
            recordNote(rightHand.angle);
            prevNoteRef.current = note;
          }
        } else {
          prevNoteRef.current = null;
        }

        updateLooper(leftHandGesture);

        rafIdRef.current = requestAnimationFrame(tick);
      };
      rafIdRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.error('Error starting audio context:', err);
    }
  }, []);

  useEffect(() => {
    const startHandler = () => {
      void startAudioContext();
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

    return () => {
      window.removeEventListener('click', startHandler);
      window.removeEventListener('touchstart', startHandler);
      window.removeEventListener('keydown', startHandler);
      window.removeEventListener('keydown', keyHandler);
      cancelAnimationFrame(rafIdRef.current);
      disposeLooper();
      disposeSynthChain();
    };
  }, [startAudioContext]);

  return null;
};