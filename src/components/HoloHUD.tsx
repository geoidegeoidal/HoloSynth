import { useRef, useEffect } from 'react';
import { useCurrentNote, useLooperState } from '../store/useSynthStore';
import { getWaveformData, getRecordBuffer, getLoopDuration } from '../modules/audio/looper';
import { SCALE } from '../modules/audio/synthCore';
import type { LooperState } from '../types';

const NOTE_COLORS: Record<string, string> = {
  'C3': '#ff0044', 'D3': '#ff3377', 'Eb3': '#dd00ff',
  'F3': '#8800ff', 'G3': '#4400ff', 'A3': '#0055ff',
  'Bb3': '#0099ff', 'C4': '#00ddff', 'D4': '#00ffdd',
  'Eb4': '#00ff88', 'F4': '#33ff33', 'G4': '#88ff00',
  'A4': '#ccff00', 'Bb4': '#ffee00', 'C5': '#ffcc00',
};

function noteColor(note: string): string {
  return NOTE_COLORS[note] ?? '#00ffff';
}

function noteFreqLabel(note: string): string {
  const freqMap: Record<string, number> = {
    'C3': 130.81, 'D3': 146.83, 'Eb3': 155.56, 'F3': 174.61,
    'G3': 196.00, 'A3': 220.00, 'Bb3': 233.08,
    'C4': 261.63, 'D4': 293.66, 'Eb4': 311.13, 'F4': 349.23,
    'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16, 'C5': 523.25,
  };
  return freqMap[note] ? `${Math.round(freqMap[note]!)}Hz` : '';
}

const STYLES = `
@keyframes noteGlow {
  0%, 100% { filter: drop-shadow(0 0 12px var(--glow)) drop-shadow(0 0 40px var(--glow)); }
  50% { filter: drop-shadow(0 0 20px var(--glow)) drop-shadow(0 0 60px var(--glow)); }
}
@keyframes recPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
`;

export const HoloHUD = () => {
  const currentNote = useCurrentNote();
  const looperState = useLooperState();
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const currentNoteRef = useRef(currentNote);
  const looperStateRef = useRef(looperState);

  useEffect(() => {
    currentNoteRef.current = currentNote;
    looperStateRef.current = looperState;
  });

  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;

    const drawWaveform = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const buffer = getRecordBuffer();
      const data = getWaveformData();
      const now = performance.now() / 1000;
      const ls = looperStateRef.current;
      const cn = currentNoteRef.current;

      if (ls === 'idle' && buffer.length === 0) {
        const idleSpacing = 4;
        const idleBarW = 2;
        ctx.fillStyle = 'rgba(0, 255, 255, 0.08)';
        for (let x = 0; x < w; x += idleSpacing) {
          const barH = Math.sin(x * 0.05 + now * 2) * 4 + 6;
          ctx.fillRect(x, h / 2 - barH / 2, idleBarW, barH);
        }
      } else {
        const duration = getLoopDuration();

        for (let i = 0; i < buffer.length; i++) {
          const ev = buffer[i]!;
          const x = (ev.time / (duration || 1)) * w;
          const color = noteColor(ev.note);
          const isCurrent = ev.note === cn && cn !== '';
          const barH = isCurrent ? 28 : 18;
          const y = h / 2 - barH / 2;

          ctx.save();
          ctx.shadowColor = color;
          ctx.shadowBlur = isCurrent ? 16 : 6;
          ctx.fillStyle = isCurrent ? color : color + 'aa';
          ctx.fillRect(x - 1, y, 3, barH);
          ctx.restore();
        }

        const playheadX = (ls === 'playing' || ls === 'muted')
          ? ((now % (duration || 1)) / (duration || 1)) * w
          : -1;

        if (playheadX >= 0) {
          ctx.save();
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(playheadX - 1, 0, 2, h);
          ctx.restore();
        }
      }

      if (data.length > 0 && (ls === 'playing' || ls === 'muted')) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const sliceW = w / data.length;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] as number) * 0.5;
          const y = h / 2 + v * h * 0.4;
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i * sliceW, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      rafId = requestAnimationFrame(drawWaveform);
    };

    rafId = requestAnimationFrame(drawWaveform);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const activeIdx = SCALE.indexOf(currentNote as typeof SCALE[number]);
  const displayNote = currentNote || '—';
  const displayFreq = currentNote ? noteFreqLabel(currentNote) : '';
  const noteColorStr = currentNote ? noteColor(currentNote) : '#00ffff';
  const hasActiveNote = currentNote !== '';

  const looperLabel: Record<LooperState, string> = {
    idle: 'SPACE to record',
    recording: 'REC',
    playing: 'PLAYING',
    muted: 'MUTED',
  };

  const looperColor: Record<LooperState, string> = {
    idle: 'rgba(0,255,255,0.4)',
    recording: '#ff0055',
    playing: '#00ff88',
    muted: '#ff8800',
  };

  return (
    <>
      <style>{STYLES}</style>

      {/* Note arc */}
      <div style={styles.noteArc}>
        <svg viewBox="0 0 440 240" style={styles.arcSvg}>
          <path
            d="M 50 200 A 170 170 0 0 1 390 200"
            fill="none"
            stroke="rgba(0,255,255,0.06)"
            strokeWidth="2"
          />

          {SCALE.map((note, i) => {
            const t = i / (SCALE.length - 1);
            const a = Math.PI - t * Math.PI;
            const cx = 220 + Math.cos(a) * 170;
            const cy = 200 - Math.sin(a) * 170;
            const isActive = i === activeIdx && hasActiveNote;
            const color = noteColor(note);
            return (
              <g key={note}>
                {isActive && (
                  <>
                    <circle cx={cx} cy={cy} r="18" fill={color} opacity="0.15">
                      <animate attributeName="r" values="18;28;18" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={cx} cy={cy} r="12" fill={color} opacity="0.3" />
                  </>
                )}
                <circle
                  cx={cx} cy={cy}
                  r={isActive ? 8 : 4}
                  fill={isActive ? color : 'transparent'}
                  stroke={isActive ? color : 'rgba(255,255,255,0.1)'}
                  strokeWidth={isActive ? 2.5 : 1}
                />
                <text
                  x={cx} y={cy + 26}
                  textAnchor="middle"
                  fill={isActive ? color : 'rgba(255,255,255,0.15)'}
                  fontSize={isActive ? 12 : 7}
                  fontFamily="system-ui, monospace"
                  fontWeight={isActive ? 700 : 400}
                >
                  {note}
                </text>
              </g>
            );
          })}

          <text x={220} y={215} textAnchor="middle" fill="rgba(0,255,255,0.12)"
            fontSize="9" fontFamily="system-ui, monospace" letterSpacing="3">
            C DORIAN
          </text>
        </svg>
      </div>

      {/* Current note display */}
      <div style={styles.noteDisplay}>
        <div style={{
          ...styles.noteLetter,
          color: currentNote ? noteColorStr : 'rgba(0,255,255,0.12)',
          '--glow': currentNote ? noteColorStr : '#00ffff',
          animation: currentNote && hasActiveNote ? 'noteGlow 1.2s ease-in-out infinite' : 'none',
        } as React.CSSProperties}>
          {displayNote}
        </div>
        {displayFreq && hasActiveNote && (
          <div style={{ ...styles.freqLabel, color: noteColorStr + 'aa' }}>
            {displayFreq}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div style={styles.bottomBar}>
        <div style={styles.looperControls}>
          <div style={{ ...styles.looperBadge, background: looperColor[looperState] }}>
            {looperState === 'recording' && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff0055', animation: 'recPulse 0.8s ease-in-out infinite', display: 'inline-block', marginRight: 6 }} />
            )}
            {looperLabel[looperState]}
          </div>
          <div style={styles.keyHints}>
            <span style={styles.keyHint}><kbd style={styles.kbd}>SPACE</kbd> rec/stop</span>
            <span style={styles.keyHint}><kbd style={styles.kbd}>M</kbd> mute</span>
            <span style={styles.keyHint}><kbd style={styles.kbd}>C</kbd> clear</span>
          </div>
        </div>
        <canvas ref={waveformRef} width={600} height={80} style={styles.waveform} />
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  noteArc: {
    position: 'fixed',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 440,
    zIndex: 800,
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  arcSvg: {
    width: '100%',
    height: 'auto',
  },
  noteDisplay: {
    position: 'fixed',
    bottom: 120,
    left: 24,
    zIndex: 800,
    pointerEvents: 'none',
  },
  noteLetter: {
    fontSize: 56,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 800,
    letterSpacing: 2,
    lineHeight: 1,
    transition: 'color 0.15s ease',
  },
  freqLabel: {
    fontSize: 12,
    fontFamily: 'system-ui, monospace',
    fontWeight: 500,
    marginTop: 4,
    transition: 'color 0.15s ease',
  },
  bottomBar: {
    position: 'fixed',
    bottom: 16,
    left: 16,
    right: 16,
    height: 80,
    zIndex: 800,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    pointerEvents: 'none',
  },
  looperControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 160,
    flexShrink: 0,
  },
  looperBadge: {
    padding: '4px 12px',
    borderRadius: 6,
    fontSize: 11,
    fontFamily: 'system-ui, monospace',
    fontWeight: 700,
    color: '#050510',
    display: 'flex',
    alignItems: 'center',
    letterSpacing: 1,
  },
  keyHints: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  keyHint: {
    fontSize: 10,
    fontFamily: 'system-ui, monospace',
    color: 'rgba(255,255,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  },
  kbd: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 3,
    padding: '1px 5px',
    fontSize: 10,
    fontFamily: 'system-ui, monospace',
    color: 'rgba(255,255,255,0.5)',
  },
  waveform: {
    flex: 1,
    height: 80,
    borderRadius: 8,
    background: 'rgba(5,5,16,0.7)',
    border: '1px solid rgba(0,255,255,0.1)',
  },
};
