import { useSynthStore, useActivePads } from '../../store/useSynthStore';

const PAD_COLORS = [
  '#ff3355', // Kick - Red
  '#ffaa00', // Snare - Orange
  '#ffdd00', // Closed Hat - Yellow
  '#66ff33', // Open Hat - Green
  '#00ddff', // Tom Low - Cyan
  '#3366ff', // Tom High - Blue
  '#aa33ff', // Clap - Purple
  '#ff33aa', // Crash - Pink
];

const PAD_LABELS = [
  'KICK',
  'SNARE',
  'CHAT',
  'OHAT',
  'TOM L',
  'TOM H',
  'CLAP',
  'CRASH',
];

const KEYFRAMES = `
@keyframes padFlash {
  0% { transform: scale(1); filter: brightness(1); }
  40% { transform: scale(0.95); filter: brightness(1.8); }
  100% { transform: scale(1); filter: brightness(1); }
}
`;

export const PadGrid = () => {
  const activePads = useActivePads();
  const triggerPad = useSynthStore(s => s.triggerPad);
  const releasePad = useSynthStore(s => s.releasePad);

  const handlePadDown = (id: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    triggerPad(id);
  };

  const handlePadUp = (id: number) => () => {
    releasePad(id);
  };

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={styles.container}>
        <div style={styles.label}>PADS</div>
        <div style={styles.grid}>
          {Array.from({ length: 8 }, (_, i) => {
            const active = activePads.has(i);
            const color = PAD_COLORS[i]!;
            return (
              <div
                key={i}
                style={{
                  ...styles.pad,
                  background: active
                    ? `radial-gradient(circle at 50% 50%, ${color}60, ${color}20)`
                    : `radial-gradient(circle at 50% 50%, ${color}15, ${color}05)`,
                  borderColor: active ? `${color}80` : `${color}20`,
                  boxShadow: active
                    ? `0 0 20px ${color}50, 0 0 40px ${color}20, inset 0 0 12px ${color}30`
                    : `0 0 0px ${color}00`,
                  animation: active ? 'padFlash 0.2s ease-out' : 'none',
                }}
                onMouseDown={handlePadDown(i)}
                onMouseUp={handlePadUp(i)}
                onMouseLeave={handlePadUp(i)}
              >
                <span style={{
                  ...styles.padLabel,
                  color: active ? color : `${color}60`,
                  textShadow: active ? `0 0 8px ${color}` : 'none',
                }}>
                  {PAD_LABELS[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 8,
    fontFamily: 'system-ui, monospace',
    color: 'rgba(0,255,255,0.25)',
    letterSpacing: 3,
    textAlign: 'center' as const,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
  },
  pad: {
    width: 52,
    height: 52,
    borderRadius: 8,
    border: '1.5px solid',
    cursor: 'pointer' as const,
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    transition: 'all 0.08s ease',
    userSelect: 'none' as const,
    backdropFilter: 'blur(4px)',
  },
  padLabel: {
    fontSize: 8,
    fontFamily: 'system-ui, monospace',
    fontWeight: 700,
    letterSpacing: 1,
    transition: 'all 0.1s ease',
    pointerEvents: 'none' as const,
  },
};
