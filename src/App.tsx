import { Suspense, lazy, useRef, useCallback } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { CameraOverlay } from './components/CameraOverlay';
import { HoloHUD } from './components/HoloHUD';
import { CameraPiP } from './components/CameraPiP';
import type { HandTrackerHandle } from './modules/vision/HandTracker';

const HandTracker = lazy(() => import('./modules/vision/HandTracker').then(m => ({ default: m.HandTracker })));
const AudioEngine = lazy(() => import('./modules/audio/AudioEngine').then(m => ({ default: m.AudioEngine })));
const SynthCanvas = lazy(() => import('./modules/visual/SynthCanvas').then(m => ({ default: m.SynthCanvas })));

const KEYFRAMES = `
@keyframes camPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
`;

function App() {
  const trackerRef = useRef<HandTrackerHandle>(null);

  const getVideoEl = useCallback(() => {
    return trackerRef.current?.getVideoElement() ?? null;
  }, []);

  return (
    <>
      <style>{KEYFRAMES}</style>
      <ErrorBoundary>
        <div style={{ width: '100vw', height: '100vh', background: '#050510', overflow: 'hidden' }}>
          <Suspense fallback={null}>
            <HandTracker ref={trackerRef} />
            <AudioEngine />
            <SynthCanvas />
          </Suspense>
          <CameraPiP videoEl={getVideoEl()} />
          <LoadingScreen />
          <CameraOverlay />
          <HoloHUD />
        </div>
      </ErrorBoundary>
    </>
  );
}

export default App;