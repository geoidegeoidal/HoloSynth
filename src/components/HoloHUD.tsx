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
@keyframes posRing {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}
`;

export const HoloHUD = () => {
  const currentNote = useHoloStore((s) => s.currentNote);
  const angle = useHoloStore((s) => s.rightHand.angle);
  const radius = useHoloStore((s) => s.rightHand.radius);
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
  const noteColorStr = currentNote ? noteColor(currentNote) : '#00ffff';

  // Map angle (0-360) to position on the arc (t parameter 0-1)
  const arcT = (angle % 360) / 360;

  // Position dot coordinates (mirrored for front camera)
  const dotX = 1 - (angle % 360) / 360;  // mirrored X
  const dotY = radius;

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

      {/* Note arc with position indicator */}
      <div style={styles.noteArc}>
        <svg viewBox="0 0 440 240" style={styles.arcSvg}>
          {/* Background arc path */}
          <path
            d="M 50 200 A 170 170 0 0 1 390 200"
            fill="none"
            stroke="rgba(0,255,255,0.06)"
            strokeWidth="2"
          />

          {/* Active arc segment (glow trail) */}
          {isVisible && (
            <path
              d={`M 50 200 A 170 170 0 0 1 ${50 + arcT * 340} ${200 - Math.sin(arcT * Math.PI) * 170}`}
              fill="none"
              stroke={noteColorStr}
              strokeWidth="3"
              opacity="0.5"
              style={{ filter: `drop-shadow(0 0 8px ${noteColorStr})` }}
            />
          )}

          {/* Note dots on arc */}
          {SCALE.map((note, i) => {
            const t = i / (SCALE.length - 1);
            const a = Math.PI - t * Math.PI;
            const cx = 220 + Math.cos(a) * 170;
            const cy = 200 - Math.sin(a) * 170;
            const isActive = i === activeIdx && isVisible;
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

          {/* Bright dot that follows hand position on arc */}
          {isVisible && (() => {
            const a = Math.PI - arcT * Math.PI;
            const px = 220 + Math.cos(a) * 170;
            const py = 200 - Math.sin(a) * 170;
            return (
              <g>
                {/* Outer glow ring */}
                <circle cx={px} cy={py} r="20" fill="none" stroke={noteColorStr} strokeWidth="1.5" opacity="0.4">
                  <animate attributeName="r" values="20;28;20" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.2s" repeatCount="indefinite" />
                </circle>
                {/* Inner bright dot */}
                <circle cx={px} cy={py} r="6" fill={noteColorStr} opacity="0.9">
                  <animate attributeName="r" values="6;8;6" dur="0.8s" repeatCount="indefinite" />
                </circle>
                {/* Center white core */}
                <circle cx={px} cy={py} r="2.5" fill="#ffffff" opacity="0.95" />
              </g>
            );
          })()}

          {/* Scale label */}
          <text x={220} y={215} textAnchor="middle" fill="rgba(0,255,255,0.12)"
            fontSize="9" fontFamily="system-ui, monospace" letterSpacing="3">
            C DORIAN
          </text>
        </svg>

        {/* Position circle below arc */}
        <div style={styles.positionCircle}>
          {/* Outer ring */}
          <div style={{
            ...styles.posOuterRing,
            borderColor: isVisible ? `${noteColorStr}40` : 'rgba(255,255,255,0.06)',
            boxShadow: isVisible ? `0 0 20px ${noteColorStr}20, inset 0 0 20px ${noteColorStr}10` : 'none',
          }}>
            {/* Crosshair lines */}
            <div style={{ ...styles.crosshairH, background: isVisible ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)' }} />
            <div style={{ ...styles.crosshairV, background: isVisible ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)' }} />

            {/* Position dot */}
            {isVisible && (
              <div style={{
                ...styles.posDot,
                left: `${dotX * 100}%`,
                top: `${dotY * 80 + 10}%`,
                background: noteColorStr,
                boxShadow: `0 0 12px ${noteColorStr}, 0 0 24px ${noteColorStr}80`,
              }} />
            )}

            {/* Axis labels */}
            <span style={{ ...styles.axisLabel, left: 4, top: '50%', transform: 'translateY(-50%)' }}>L</span>
            <span style={{ ...styles.axisLabel, right: 4, top: '50%', transform: 'translateY(-50%)' }}>H</span>
            <span style={{ ...styles.axisLabel, top: 4, left: '50%', transform: 'translateX(-50%)' }}>↑</span>
            <span style={{ ...styles.axisLabel, bottom: 4, left: '50%', transform: 'translateX(-50%)' }}>↓</span>
          </div>
          <div style={{ ...styles.posLabel, color: isVisible ? noteColorStr + '80' : 'rgba(255,255,255,0.1)' }}>
            POSITION
          </div>
        </div>
      </div>

      {/* Current note display */}
      <div style={styles.noteDisplay}>
        <div style={{
          ...styles.noteLetter,
          color: currentNote ? noteColorStr : 'rgba(0,255,255,0.12)',
          '--glow': currentNote ? noteColorStr : '#00ffff',
          animation: currentNote && isVisible ? 'noteGlow 1.2s ease-in-out infinite' : 'none',
        } as React.CSSProperties}>
          {displayNote}
        </div>
        {displayFreq && isVisible && (
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
  positionCircle: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    marginTop: -8,
  },
  posOuterRing: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    border: '1.5px solid',
    position: 'relative',
    overflow: 'hidden',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  posDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
    transition: 'left 0.08s ease, top 0.08s ease, background 0.15s ease',
  },
  crosshairH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    transform: 'translateY(-50%)',
  },
  crosshairV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    transform: 'translateX(-50%)',
  },
  axisLabel: {
    position: 'absolute',
    fontSize: 7,
    fontFamily: 'system-ui, monospace',
    color: 'rgba(255,255,255,0.15)',
    pointerEvents: 'none',
  },
  posLabel: {
    fontSize: 7,
    fontFamily: 'system-ui, monospace',
    letterSpacing: 2,
    transition: 'color 0.15s ease',
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