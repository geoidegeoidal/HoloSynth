import { useRef, useEffect, useCallback } from 'react';
import { useHoloStore } from '../store/useHoloStore';
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
@keyframes camPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
`;

export const HoloHUD = () => {
  const currentNote = useHoloStore((s) => s.currentNote);
  const angle = useHoloStore((s) => s.rightHand.angle);
  const isVisible = useHoloStore((s) => s.rightHand.isVisible);
  const looperState = useHoloStore((s) => s.looperState) as LooperState;
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const drawWaveform = useCallback(() => {
    const canvas = waveformRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const buffer = getRecordBuffer();
    const data = getWaveformData();
    const now = performance.now() / 1000;

    if (looperState === 'idle' && buffer.length === 0) {
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
        const isCurrent = ev.note === currentNote && isVisible;
        const barH = isCurrent ? 28 : 18;
        const y = h / 2 - barH / 2;

        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = isCurrent ? 16 : 6;
        ctx.fillStyle = isCurrent ? color : color + 'aa';
        ctx.fillRect(x - 1, y, 3, barH);
        ctx.restore();
      }

      const playheadX = (looperState === 'playing' || looperState === 'muted')
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

    if (data.length > 0 && (looperState === 'playing' || looperState === 'muted')) {
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

    rafRef.current = requestAnimationFrame(drawWaveform);
  }, [currentNote, isVisible, looperState]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(drawWaveform);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawWaveform]);

  const activeIdx = SCALE.indexOf(currentNote as typeof SCALE[number]);
  const displayNote = currentNote || '—';
  const displayFreq = currentNote ? noteFreqLabel(currentNote) : '';

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
        <svg viewBox="0 0 440 220" style={styles.arcSvg}>
          {/* Background arc path */}
          <path
            d="M 50 200 A 170 170 0 0 1 390 200"
            fill="none"
            stroke="rgba(0,255,255,0.06)"
            strokeWidth="2"
          />
          {/* Active arc segment */}
          {isVisible && (() => {
            const t = (angle % 360) / 360;
            const startAngle = Math.PI;
            const endAngle = Math.PI - t * Math.PI;
            const cx = 220, cy = 200, r = 170;
            const sx = cx + Math.cos(startAngle) * r;
            const sy = cy - Math.sin(startAngle) * r;
            const ex = cx + Math.cos(endAngle) * r;
            const ey = cy - Math.sin(endAngle) * r;
            const largeArc = t > 0.5 ? 1 : 0;
            return (
              <path
                d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 0 ${ex} ${ey}`}
                fill="none"
                stroke={noteColor(currentNote)}
                strokeWidth="3"
                opacity="0.5"
                style={{ filter: `drop-shadow(0 0 6px ${noteColor(currentNote)})` }}
              />
            );
          })()}
          {/* Note dots on arc */}
          {SCALE.map((note, i) => {
            const t = i / (SCALE.length - 1);
            const a = Math.PI - t * Math.PI;
            const dotR = 170;
            const cx = 220 + Math.cos(a) * dotR;
            const cy = 200 - Math.sin(a) * dotR;
            const isActive = i === activeIdx && isVisible;
            const color = noteColor(note);
            return (
              <g key={note}>
                {isActive && (
                  <circle cx={cx} cy={cy} r="14" fill={color} opacity="0.25">
                    <animate attributeName="r" values="14;22;14" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={cx} cy={cy}
                  r={isActive ? 9 : 5}
                  fill={isActive ? color : 'transparent'}
                  stroke={isActive ? color : 'rgba(255,255,255,0.12)'}
                  strokeWidth={isActive ? 2 : 1}
                />
                <text
                  x={cx} y={cy + 24}
                  textAnchor="middle"
                  fill={isActive ? color : 'rgba(255,255,255,0.18)'}
                  fontSize={isActive ? 11 : 7}
                  fontFamily="system-ui, monospace"
                  fontWeight={isActive ? 700 : 400}
                >
                  {note}
                </text>
              </g>
            );
          })}
          {/* Pointer needle */}
          {isVisible && (() => {
            const t = (angle % 360) / 360;
            const a = Math.PI - t * Math.PI;
            const px = 220 + Math.cos(a) * 170;
            const py = 200 - Math.sin(a) * 170;
            return (
              <line x1={220} y1={200} x2={px} y2={py}
                stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="4 4" />
            );
          })()}
          {/* Scale name */}
          <text x={220} y={195} textAnchor="middle" fill="rgba(0,255,255,0.15)"
            fontSize="10" fontFamily="system-ui, monospace" letterSpacing="2">
            C DORIAN
          </text>
        </svg>
      </div>

      {/* Current note display */}
      <div style={styles.noteDisplay}>
        <div style={{
          ...styles.noteLetter,
          color: currentNote ? noteColor(currentNote) : 'rgba(0,255,255,0.12)',
          '--glow': currentNote ? noteColor(currentNote) : '#00ffff',
          animation: currentNote && isVisible ? 'noteGlow 1.2s ease-in-out infinite' : 'none',
        } as React.CSSProperties}>
          {displayNote}
        </div>
        {displayFreq && isVisible && (
          <div style={{ ...styles.freqLabel, color: noteColor(currentNote) + 'aa' }}>
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
    height: 220,
    zIndex: 800,
    pointerEvents: 'none',
  },
  arcSvg: {
    width: '100%',
    height: '100%',
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