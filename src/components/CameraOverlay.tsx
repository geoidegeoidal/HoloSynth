import type { CameraStatus } from '../types';
import { useCameraStatus } from '../store/useHoloStore';

const STATUS_COPY: Record<CameraStatus, { label: string; color: string; glow: string }> = {
  waiting: {
    label: 'Camera waiting...',
    color: '#8888aa',
    glow: '#8888aa40',
  },
  active: {
    label: 'Camera active',
    color: '#00ff88',
    glow: '#00ff8880',
  },
  error: {
    label: 'Camera error',
    color: '#ff4444',
    glow: '#ff444480',
  },
  denied: {
    label: 'Camera denied',
    color: '#ff4444',
    glow: '#ff444480',
  },
};

const KEYFRAMES = `
@keyframes camPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
`;

export const CameraOverlay = () => {
  const cameraStatus = useCameraStatus();
  const info = STATUS_COPY[cameraStatus];

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={styles.container}>
        <div style={styles.status}>
          <span
            style={{
              ...styles.dot,
              background: info.color,
              boxShadow: `0 0 8px ${info.glow}`,
              animation:
                cameraStatus === 'active' ? 'camPulse 2s ease-in-out infinite' : undefined,
            }}
          />
          <span style={{ ...styles.label, color: info.color }}>{info.label}</span>
        </div>

        {(cameraStatus === 'waiting' || cameraStatus === 'denied') && (
          <div style={styles.instructions}>
            <p style={styles.instrTitle}>
              {cameraStatus === 'waiting'
                ? 'Allow camera access to begin'
                : 'Camera access is required'}
            </p>
            <p style={styles.instrText}>
              {cameraStatus === 'waiting'
                ? 'HoloSynth needs camera access to track your hand movements. A permission dialog will appear.'
                : 'Please enable camera permissions in your browser settings and reload the page.'}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 16,
    right: 16,
    zIndex: 900,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
  },
  status: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    borderRadius: 8,
    background: 'rgba(5, 5, 16, 0.85)',
    border: '1px solid #ffffff15',
    backdropFilter: 'blur(8px)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  label: {
    fontSize: 11,
    fontFamily: 'system-ui, monospace',
    fontWeight: 500,
  },
  instructions: {
    padding: '12px 16px',
    borderRadius: 8,
    background: 'rgba(5, 5, 16, 0.9)',
    border: '1px solid #ffffff12',
    maxWidth: 280,
    backdropFilter: 'blur(8px)',
  },
  instrTitle: {
    color: '#00ffff',
    fontSize: 12,
    fontWeight: 600,
    margin: '0 0 6px 0',
    fontFamily: 'system-ui, sans-serif',
  },
  instrText: {
    color: '#7777aa',
    fontSize: 11,
    margin: 0,
    fontFamily: 'system-ui, sans-serif',
    lineHeight: 1.5,
  },
};
