import { useRef, useCallback, useEffect } from 'react';
import { useSynthStore, usePitchBend, useModulation } from '../../store/useSynthStore';

const STRIP_H = 120;
const STRIP_W = 18;

export const TouchStrips = () => {
  const pitchBend = usePitchBend();
  const modulation = useModulation();
  const setPitchBend = useSynthStore(s => s.setPitchBend);
  const setModulation = useSynthStore(s => s.setModulation);

  const pbDragging = useRef(false);
  const modDragging = useRef(false);

  const getValueFromEvent = useCallback((e: React.MouseEvent | MouseEvent, el: HTMLElement): number => {
    const rect = el.getBoundingClientRect();
    const y = e.clientY - rect.top;
    return 1 - Math.max(0, Math.min(1, y / STRIP_H));
  }, []);

  const handlePBMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    pbDragging.current = true;
    const val = getValueFromEvent(e, e.currentTarget as HTMLElement);
    setPitchBend(val * 2 - 1);
  }, [getValueFromEvent, setPitchBend]);

  const handleModMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    modDragging.current = true;
    const val = getValueFromEvent(e, e.currentTarget as HTMLElement);
    setModulation(val);
  }, [getValueFromEvent, setModulation]);

  const pbRef = useRef<HTMLDivElement>(null);
  const modRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (pbDragging.current && pbRef.current) {
        const val = getValueFromEvent(e, pbRef.current);
        setPitchBend(val * 2 - 1);
      }
      if (modDragging.current && modRef.current) {
        const val = getValueFromEvent(e, modRef.current);
        setModulation(val);
      }
    };

    const handleMouseUp = () => {
      if (pbDragging.current) {
        pbDragging.current = false;
        setPitchBend(0);
      }
      if (modDragging.current) {
        modDragging.current = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [getValueFromEvent, setPitchBend, setModulation]);

  const pbDisplay = pitchBend + 1;
  const modDisplay = modulation;

  return (
    <div style={styles.container}>
      <div style={styles.stripGroup}>
        <span style={styles.stripLabel}>PB</span>
        <div
          ref={pbRef}
          style={styles.strip}
          onMouseDown={handlePBMouseDown}
        >
          <div style={{
            ...styles.stripFill,
            height: `${pbDisplay * 100}%`,
          }} />
          <div style={{
            ...styles.centerLine,
            top: '50%',
            background: 'rgba(0,255,255,0.3)',
          }} />
        </div>
        <span style={styles.stripValue}>{pitchBend.toFixed(2)}</span>
      </div>

      <div style={styles.stripGroup}>
        <span style={styles.stripLabel}>MW</span>
        <div
          ref={modRef}
          style={styles.strip}
          onMouseDown={handleModMouseDown}
        >
          <div style={{
            ...styles.stripFill,
            height: `${modDisplay * 100}%`,
            background: 'linear-gradient(180deg, #ff00ff 0%, #ff00ff40 100%)',
            boxShadow: '0 0 10px rgba(255,0,255,0.4)',
          }} />
        </div>
        <span style={{ ...styles.stripValue, color: '#ff00ff' }}>{modDisplay.toFixed(2)}</span>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: 12,
  },
  stripGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center' as const,
    gap: 4,
    userSelect: 'none' as const,
  },
  stripLabel: {
    fontSize: 8,
    fontFamily: 'system-ui, monospace',
    color: 'rgba(0,255,255,0.3)',
    letterSpacing: 1,
  },
  strip: {
    width: STRIP_W,
    height: STRIP_H,
    borderRadius: STRIP_W / 2,
    background: 'rgba(0,255,255,0.03)',
    border: '1px solid rgba(0,255,255,0.1)',
    cursor: 'pointer' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  stripFill: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(180deg, #00ffff 0%, #00ffff40 100%)',
    boxShadow: '0 0 10px rgba(0,255,255,0.4)',
    transition: 'height 0.06s ease',
  },
  centerLine: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    height: 1,
  },
  stripValue: {
    fontSize: 9,
    fontFamily: 'system-ui, monospace',
    color: '#00ffff',
    fontWeight: 600,
    textShadow: '0 0 6px rgba(0,255,255,0.3)',
  },
};
