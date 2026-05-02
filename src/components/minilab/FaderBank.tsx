import { useRef, useCallback, useEffect } from 'react';
import { useSynthStore, useFaders } from '../../store/useSynthStore';
import type { FaderValues } from '../../types';

interface FaderDef {
  id: keyof FaderValues;
  label: string;
}

const FADER_DEFS: FaderDef[] = [
  { id: 'attack', label: 'ATK' },
  { id: 'decay', label: 'DEC' },
  { id: 'sustain', label: 'SUS' },
  { id: 'release', label: 'REL' },
];

const TRACK_H = 120;
const TRACK_W = 24;
const THUMB_H = 18;

export const FaderBank = () => {
  const faders = useFaders();
  const setFader = useSynthStore(s => s.setFader);
  const draggingRef = useRef<{ id: keyof FaderValues; startY: number; startVal: number } | null>(null);
  const trackRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const setTrackRef = (id: string) => (el: HTMLDivElement | null) => {
    trackRefs.current[id] = el;
  };

  const handleMouseDown = useCallback((id: keyof FaderValues) => (e: React.MouseEvent) => {
    e.preventDefault();
    const track = trackRefs.current[id];
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const val = 1 - Math.max(0, Math.min(1, (y - THUMB_H / 2) / (TRACK_H - THUMB_H)));
    setFader(id, val);
    draggingRef.current = { id, startY: e.clientY, startVal: faders[id] };
  }, [faders, setFader]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const drag = draggingRef.current;
      if (!drag) return;
      const delta = (drag.startY - e.clientY) / (TRACK_H - THUMB_H);
      const newVal = Math.max(0, Math.min(1, drag.startVal + delta));
      setFader(drag.id, newVal);
    };

    const handleMouseUp = () => {
      draggingRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setFader]);

  return (
    <div style={styles.container}>
      <div style={styles.label}>ADSR</div>
      <div style={styles.faderRow}>
        {FADER_DEFS.map((fader) => {
          const val = faders[fader.id];
          const thumbTop = (1 - val) * (TRACK_H - THUMB_H);
          return (
            <div key={fader.id} style={styles.faderWrapper}>
              <div
                ref={setTrackRef(fader.id)}
                style={styles.track}
                onMouseDown={handleMouseDown(fader.id)}
              >
                {/* Track background */}
                <div style={styles.trackBg} />
                {/* Filled track (illuminated) */}
                <div style={{
                  ...styles.trackFill,
                  height: `${val * 100}%`,
                  background: 'linear-gradient(180deg, #00ffff 0%, #00ffff40 100%)',
                  boxShadow: '0 0 12px rgba(0,255,255,0.4)',
                }} />
                {/* Thumb */}
                <div style={{
                  ...styles.thumb,
                  top: thumbTop,
                  borderColor: '#00ffff',
                  boxShadow: '0 0 12px rgba(0,255,255,0.6), 0 0 24px rgba(0,255,255,0.2)',
                  background: 'linear-gradient(135deg, #0a0a20, #1a1a40)',
                }}>
                  <div style={{
                    width: 8,
                    height: 2,
                    background: '#00ffff',
                    borderRadius: 1,
                    boxShadow: '0 0 6px #00ffff',
                  }} />
                </div>
              </div>
              <span style={styles.faderLabel}>{fader.label}</span>
              <span style={styles.faderValue}>{Math.round(val * 100)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    alignItems: 'center' as const,
  },
  label: {
    fontSize: 8,
    fontFamily: 'system-ui, monospace',
    color: 'rgba(0,255,255,0.25)',
    letterSpacing: 3,
  },
  faderRow: {
    display: 'flex',
    gap: 16,
  },
  faderWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center' as const,
    gap: 4,
    userSelect: 'none' as const,
  },
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: TRACK_W / 2,
    background: 'rgba(0,255,255,0.03)',
    border: '1px solid rgba(0,255,255,0.1)',
    position: 'relative' as const,
    cursor: 'pointer' as const,
    overflow: 'hidden' as const,
  },
  trackBg: {
    position: 'absolute' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
  },
  trackFill: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    transition: 'height 0.08s ease',
  },
  thumb: {
    position: 'absolute' as const,
    left: 2,
    width: TRACK_W - 4,
    height: THUMB_H,
    borderRadius: 4,
    border: '1px solid',
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    transition: 'top 0.08s ease',
  },
  faderLabel: {
    fontSize: 8,
    fontFamily: 'system-ui, monospace',
    color: 'rgba(0,255,255,0.3)',
    letterSpacing: 1,
  },
  faderValue: {
    fontSize: 10,
    fontFamily: 'system-ui, monospace',
    color: '#00ffff',
    fontWeight: 700,
    textShadow: '0 0 6px rgba(0,255,255,0.4)',
  },
};
