import { ControlPanel } from './ControlPanel';
import { VirtualPiano } from './VirtualPiano';

export const MinilabUI = () => {
  return (
    <div style={styles.container}>
      <ControlPanel />
      <div style={styles.pianoContainer}>
        <VirtualPiano />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 900,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    pointerEvents: 'none' as const,
  },
  pianoContainer: {
    pointerEvents: 'auto' as const,
    width: '100%',
    maxWidth: 700,
    padding: '0 16px 12px 16px',
    boxSizing: 'border-box' as const,
  },
};
