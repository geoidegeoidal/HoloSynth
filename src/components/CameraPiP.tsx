import { useRef, useEffect } from 'react';
import { useCameraStatus } from '../store/useHoloStore';

export const CameraPiP = ({ videoEl }: { videoEl: HTMLVideoElement | null }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const cameraStatus = useCameraStatus();

  useEffect(() => {
    if (!videoEl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      if (videoEl.readyState >= 2) {
        canvas.width = 220;
        canvas.height = 165;
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [videoEl]);

  if (cameraStatus !== 'active' || !videoEl) return null;

  return (
    <div style={styles.container}>
      <canvas ref={canvasRef} style={styles.video} />
      <div style={styles.liveDot} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 16,
    left: 16,
    zIndex: 850,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid rgba(0,255,255,0.2)',
    boxShadow: '0 0 20px rgba(0,255,255,0.1), inset 0 0 20px rgba(0,0,0,0.3)',
    background: '#050510',
  },
  video: {
    display: 'block',
    width: 220,
    height: 165,
    objectFit: 'cover',
    filter: 'contrast(1.1) saturate(0.7) brightness(0.9)',
  },
  liveDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#00ff88',
    boxShadow: '0 0 6px #00ff88',
    animation: 'camPulse 2s ease-in-out infinite',
  },
};