import { useCallback, useEffect, useRef } from 'react';
import { useSynthStore, useOctaveOffset } from '../../store/useSynthStore';

const WHITE_KEYS = [
  { note: 'C3', label: 'C3' },
  { note: 'D3', label: 'D3' },
  { note: 'E3', label: 'E3' },
  { note: 'F3', label: 'F3' },
  { note: 'G3', label: 'G3' },
  { note: 'A3', label: 'A3' },
  { note: 'B3', label: 'B3' },
  { note: 'C4', label: 'C4' },
  { note: 'D4', label: 'D4' },
  { note: 'E4', label: 'E4' },
  { note: 'F4', label: 'F4' },
  { note: 'G4', label: 'G4' },
  { note: 'A4', label: 'A4' },
  { note: 'B4', label: 'B4' },
  { note: 'C5', label: 'C5' },
];

const BLACK_KEY_POSITIONS = [
  { note: 'C#3', whiteIdx: 0 },
  { note: 'D#3', whiteIdx: 1 },
  { note: 'F#3', whiteIdx: 3 },
  { note: 'G#3', whiteIdx: 4 },
  { note: 'A#3', whiteIdx: 5 },
  { note: 'C#4', whiteIdx: 7 },
  { note: 'D#4', whiteIdx: 8 },
  { note: 'F#4', whiteIdx: 10 },
  { note: 'G#4', whiteIdx: 11 },
  { note: 'A#4', whiteIdx: 12 },
];

const KEY_MAP_LOWER: Record<string, number> = {
  'z': 0, 'x': 1, 'c': 2, 'v': 3, 'b': 4, 'n': 5, 'm': 6,
  ',': 7, '.': 8, '/': 9,
};

const KEY_MAP_UPPER: Record<string, number> = {
  'a': 7, 'w': 8, 's': 9, 'e': 10, 'd': 11,
  'f': 12, 't': 14, 'g': 13, 'y': 15, 'h': 16,
  'u': 17, 'j': 18, 'k': 19,
};

const KEY_MAP_BLACK_LOWER: Record<string, number> = {
  's': 0, 'd': 1, 'g': 2, 'h': 3, 'j': 4,
};

const KEY_MAP_BLACK_UPPER: Record<string, number> = {
  'e': 5, 'r': 6, 'y': 7, 'u': 8, 'i': 9,
};

function shiftNote(note: string, offset: number): string {
  const match = /^([A-G]#?)(\d+)$/.exec(note);
  if (!match) return note;
  const octave = parseInt(match[2]!, 10) + offset;
  if (octave < 0 || octave > 8) return note;
  return `${match[1]}${octave}`;
}

const getShiftedWhiteKeys = (offset: number) =>
  WHITE_KEYS.map(k => ({ ...k, note: shiftNote(k.note, offset) }));

const getShiftedBlackKeys = (offset: number) =>
  BLACK_KEY_POSITIONS.map(k => ({ ...k, note: shiftNote(k.note, offset) }));

const KEYFRAMES = `
@keyframes pianoPress {
  0% { box-shadow: 0 0 0px rgba(0,255,255,0); }
  50% { box-shadow: 0 0 20px rgba(0,255,255,0.5); }
  100% { box-shadow: 0 0 8px rgba(0,255,255,0.3); }
}
`;

export const VirtualPiano = () => {
  const octaveOffset = useOctaveOffset();
  const triggerNote = useSynthStore(s => s.triggerNote);
  const releaseNote = useSynthStore(s => s.releaseNote);
  const activeNotes = useSynthStore(s => s.activeNotes);
  const setOctaveOffset = useSynthStore(s => s.setOctaveOffset);

  const whiteKeys = getShiftedWhiteKeys(octaveOffset);
  const blackKeys = getShiftedBlackKeys(octaveOffset);
  const pressedRef = useRef(new Set<string>());

  const pressNote = useCallback((note: string) => {
    if (pressedRef.current.has(note)) return;
    pressedRef.current.add(note);
    triggerNote(note);
  }, [triggerNote]);

  const releaseNoteFromPiano = useCallback((note: string) => {
    pressedRef.current.delete(note);
    releaseNote(note);
  }, [releaseNote]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.key === 'z' && e.ctrlKey) return;
      if (e.key === 'x' && e.ctrlKey) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOctaveOffset(octaveOffset - 1);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        setOctaveOffset(octaveOffset + 1);
        return;
      }
      if (e.key === '0') {
        setOctaveOffset(0);
        return;
      }

      const key = e.key.toLowerCase();

      const whiteIdx = KEY_MAP_LOWER[key] ?? KEY_MAP_UPPER[key];
      if (whiteIdx !== undefined) {
        const note = whiteKeys[whiteIdx]?.note;
        if (note) pressNote(note);
        return;
      }

      const blackIdx = KEY_MAP_BLACK_LOWER[key] ?? KEY_MAP_BLACK_UPPER[key];
      if (blackIdx !== undefined) {
        const note = blackKeys[blackIdx]?.note;
        if (note) pressNote(note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      const whiteIdx = KEY_MAP_LOWER[key] ?? KEY_MAP_UPPER[key];
      if (whiteIdx !== undefined) {
        const note = whiteKeys[whiteIdx]?.note;
        if (note) releaseNoteFromPiano(note);
        return;
      }

      const blackIdx = KEY_MAP_BLACK_LOWER[key] ?? KEY_MAP_BLACK_UPPER[key];
      if (blackIdx !== undefined) {
        const note = blackKeys[blackIdx]?.note;
        if (note) releaseNoteFromPiano(note);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [octaveOffset, whiteKeys, blackKeys, pressNote, releaseNoteFromPiano, setOctaveOffset]);

  const noteState = useCallback((note: string) => activeNotes.has(note), [activeNotes]);

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={styles.container}>
        <div style={styles.octaveControls}>
          <button style={styles.octaveBtn} onMouseDown={(e) => { e.preventDefault(); setOctaveOffset(octaveOffset - 1); }}>
            &#9664;&#9664;
          </button>
          <span style={styles.octaveLabel}>OCT {octaveOffset > 0 ? '+' : ''}{octaveOffset}</span>
          <button style={styles.octaveBtn} onMouseDown={(e) => { e.preventDefault(); setOctaveOffset(octaveOffset + 1); }}>
            &#9654;&#9654;
          </button>
        </div>

        <div style={styles.keyboard}>
          <div style={styles.whiteKeysRow}>
            {whiteKeys.map((k) => {
              const active = noteState(k.note);
              return (
                <div
                  key={k.note}
                  style={{
                    ...styles.whiteKey,
                    background: active
                      ? 'linear-gradient(180deg, #0a0a30 0%, #1a1a50 60%, #0a0a30 100%)'
                      : 'linear-gradient(180deg, #111122 0%, #1a1a33 60%, #0d0d20 100%)',
                    borderBottomColor: active ? '#00ffff' : '#ffffff15',
                    boxShadow: active ? '0 0 18px rgba(0,255,255,0.4), inset 0 -4px 8px rgba(0,255,255,0.15)' : 'none',
                    transform: active ? 'scaleY(0.98)' : 'scaleY(1)',
                    zIndex: active ? 3 : 1,
                  }}
                  onMouseDown={(e) => { e.preventDefault(); pressNote(k.note); }}
                  onMouseUp={() => releaseNoteFromPiano(k.note)}
                  onMouseLeave={() => { if (pressedRef.current.has(k.note)) releaseNoteFromPiano(k.note); }}
                >
                  <span style={{
                    ...styles.keyLabel,
                    color: active ? '#00ffff' : '#ffffff20',
                    textShadow: active ? '0 0 8px #00ffff' : 'none',
                  }}>
                    {k.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={styles.blackKeysRow}>
            {blackKeys.map((k) => {
              const whiteKeyW = (100 / whiteKeys.length);
              const left = (k.whiteIdx + 1) * whiteKeyW - whiteKeyW * 0.35;
              const active = noteState(k.note);
              return (
                <div
                  key={k.note}
                  style={{
                    ...styles.blackKey,
                    left: `${left}%`,
                    width: `${whiteKeyW * 0.7}%`,
                    background: active
                      ? 'linear-gradient(180deg, #1a1a40 0%, #0d0d22 100%)'
                      : 'linear-gradient(180deg, #050510 0%, #0a0a18 100%)',
                    boxShadow: active ? '0 0 12px rgba(0,255,255,0.5), 0 4px 6px rgba(0,0,0,0.6)' : '0 4px 6px rgba(0,0,0,0.4)',
                    borderColor: active ? '#00ffff' : '#ffffff08',
                    transform: active ? 'translateY(2px) scaleY(0.96)' : 'translateY(0) scaleY(1)',
                    zIndex: active ? 5 : 4,
                  }}
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); pressNote(k.note); }}
                  onMouseUp={() => releaseNoteFromPiano(k.note)}
                  onMouseLeave={() => { if (pressedRef.current.has(k.note)) releaseNoteFromPiano(k.note); }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '0 4px 8px 4px',
  },
  octaveControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    userSelect: 'none' as const,
  },
  octaveBtn: {
    background: 'rgba(0,255,255,0.08)',
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 4,
    color: '#00ffff',
    fontSize: 12,
    padding: '4px 12px',
    cursor: 'pointer' as const,
    fontFamily: 'system-ui, monospace',
    transition: 'all 0.15s ease',
    outline: 'none',
  },
  octaveLabel: {
    color: 'rgba(0,255,255,0.6)',
    fontSize: 11,
    fontFamily: 'system-ui, monospace',
    letterSpacing: 2,
    minWidth: 50,
    textAlign: 'center' as const,
  },
  keyboard: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: 680,
    height: 110,
  },
  whiteKeysRow: {
    display: 'flex',
    width: '100%',
    height: '100%',
    position: 'absolute' as const,
    bottom: 0,
  },
  whiteKey: {
    flex: 1,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    border: '1px solid #ffffff10',
    borderTop: 'none',
    display: 'flex',
    alignItems: 'flex-end' as const,
    justifyContent: 'center' as const,
    paddingBottom: 4,
    cursor: 'pointer' as const,
    transition: 'all 0.06s ease',
    userSelect: 'none' as const,
    position: 'relative' as const,
  },
  keyLabel: {
    fontSize: 9,
    fontFamily: 'system-ui, monospace',
    fontWeight: 600,
    letterSpacing: 1,
    transition: 'all 0.1s ease',
  },
  blackKeysRow: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '60%',
    pointerEvents: 'none' as const,
    zIndex: 2,
  },
  blackKey: {
    position: 'absolute' as const,
    top: 0,
    height: '100%',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    border: '1px solid',
    borderTop: 'none',
    cursor: 'pointer' as const,
    transition: 'all 0.06s ease',
    userSelect: 'none' as const,
    pointerEvents: 'auto' as const,
  },
};
