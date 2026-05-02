import { useEffect, useRef, useCallback } from 'react';
import { useSynthStore, useKnobs } from '../../store/useSynthStore';
import type { KnobValues } from '../../types';

interface KnobDef {
  id: keyof KnobValues;
  label: string;
}

const KNOB_ROWS: KnobDef[][] = [
  [
    { id: 'cutoff', label: 'CUTOFF' },
    { id: 'resonance', label: 'RES' },
    { id: 'lfoRate', label: 'LFO RT' },
    { id: 'lfoDepth', label: 'LFO DP' },
  ],
  [
    { id: 'delay', label: 'DELAY' },
    { id: 'reverb', label: 'REVERB' },
    { id: 'drive', label: 'DRIVE' },
    { id: 'pan', label: 'PAN' },
  ],
];

const KNOB_SIZE = 44;
const ARC_RADIUS = 16;
const ARC_CENTER = KNOB_SIZE / 2;
const ARC_START = -135;
const ARC_SWEEP = 270;

function valueToAngle(val: number): number {
  return ARC_START + val * ARC_SWEEP;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export const KnobBank = () => {
  const knobs = useKnobs();
  const setKnob = useSynthStore(s => s.setKnob);
  const draggingRef = useRef<{ id: keyof KnobValues; startY: number; startVal: number } | null>(null);

  const handleMouseDown = useCallback((id: keyof KnobValues) => (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = { id, startY: e.clientY, startVal: knobs[id] };
    const target = e.target as HTMLElement;
    if (target.setPointerCapture) target.setPointerCapture((e.nativeEvent as PointerEvent).pointerId);
  }, [knobs]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const drag = draggingRef.current;
      if (!drag) return;
      const delta = (drag.startY - e.clientY) * 0.005;
      const newVal = Math.max(0, Math.min(1, drag.startVal + delta));
      setKnob(drag.id, newVal);
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
  }, [setKnob]);

  return (
    <div style={styles.container}>
      <div style={styles.label}>KNOBS</div>
      {KNOB_ROWS.map((row, ri) => (
        <div key={ri} style={styles.row}>
          {row.map((knob) => {
            const val = knobs[knob.id];
            const angle = valueToAngle(val);
            const activePath = describeArc(ARC_CENTER, ARC_CENTER, ARC_RADIUS, ARC_START, angle);
            const trackPath = describeArc(ARC_CENTER, ARC_CENTER, ARC_RADIUS, ARC_START, ARC_START + ARC_SWEEP);

            return (
              <div key={knob.id} style={styles.knobWrapper}>
                <svg
                  width={KNOB_SIZE}
                  height={KNOB_SIZE}
                  style={{ cursor: 'pointer' as const }}
                  onMouseDown={handleMouseDown(knob.id)}
                >
                  {/* Track */}
                  <path d={trackPath} fill="none" stroke="rgba(0,255,255,0.08)" strokeWidth="3" strokeLinecap="round" />
                  {/* Active arc */}
                  <path
                    d={activePath}
                    fill="none"
                    stroke="#00ffff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 6px #00ffff)' }}
                  />
                  {/* Dot indicator */}
                  {(() => {
                    const dot = polarToCartesian(ARC_CENTER, ARC_CENTER, ARC_RADIUS, angle);
                    return (
                      <circle cx={dot.x} cy={dot.y} r="3" fill="#00ffff" style={{ filter: 'drop-shadow(0 0 5px #00ffff)' }} />
                    );
                  })()}
                  {/* Value text */}
                  <text x={ARC_CENTER} y={ARC_CENTER + 1} textAnchor="middle" dominantBaseline="middle"
                    fill="#00ffff" fontSize="10" fontFamily="system-ui, monospace" fontWeight={700}
                    style={{ filter: 'drop-shadow(0 0 4px #00ffff80)' }}>
                    {Math.round(val * 100)}
                  </text>
                </svg>
                <span style={styles.knobLabel}>{knob.label}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  label: {
    fontSize: 8,
    fontFamily: 'system-ui, monospace',
    color: 'rgba(0,255,255,0.25)',
    letterSpacing: 3,
    textAlign: 'center' as const,
  },
  row: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center' as const,
  },
  knobWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center' as const,
    gap: 4,
    userSelect: 'none' as const,
  },
  knobLabel: {
    fontSize: 7,
    fontFamily: 'system-ui, monospace',
    color: 'rgba(0,255,255,0.3)',
    letterSpacing: 1,
  },
};
