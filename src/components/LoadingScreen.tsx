import { useState, useEffect } from 'react';
import { useIsReady } from '../store/useSynthStore';

const KEYFRAMES = `
@keyframes holoPulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
@keyframes holoSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
`;

export const LoadingScreen = () => {
  const isReady = useIsReady();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isReady) {
      const timer = setTimeout(() => setDismissed(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  if (dismissed) return null;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        style={{
          ...styles.overlay,
          animation: isReady ? 'fadeOut 0.8s ease forwards' : undefined,
          pointerEvents: isReady ? 'none' : 'auto',
        }}
      >
        <div style={styles.content}>
          <div style={styles.ring}>
            <div style={{ ...styles.ringInner, animation: 'holoSpin 3s linear infinite' }} />
          </div>
          <h1 style={styles.title}>HoloSynth</h1>
          <p style={styles.subtitle}>
            {isReady ? 'Ready' : 'Initializing audio engine...'}
          </p>
          <div style={styles.bar}>
            <div style={{ ...styles.barFill, animation: 'holoPulse 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'radial-gradient(ellipse at center, rgba(10,10,32,0.85) 0%, rgba(5,5,16,0.92) 70%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(6px)',
  },
  content: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
  },
  ring: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    border: '2px solid #00ffff30',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 50,
    height: 50,
    borderRadius: '50%',
    border: '2px solid transparent',
    borderTopColor: '#00ffff',
    borderRightColor: '#ff00ff',
  },
  title: {
    color: '#00ffff',
    fontSize: 32,
    fontWeight: 700,
    margin: 0,
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: 3,
  },
  subtitle: {
    color: '#6666aa',
    fontSize: 13,
    margin: 0,
    fontFamily: 'system-ui, monospace',
  },
  bar: {
    width: 200,
    height: 3,
    borderRadius: 2,
    background: '#ffffff10',
    overflow: 'hidden',
  },
  barFill: {
    width: '40%',
    height: '100%',
    borderRadius: 2,
    background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
  },
};

