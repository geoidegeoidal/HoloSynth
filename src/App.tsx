import { Suspense, lazy } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { CameraOverlay } from './components/CameraOverlay';

const HandTracker = lazy(() => import('./modules/vision/HandTracker').then(m => ({ default: m.HandTracker })));
const AudioEngine = lazy(() => import('./modules/audio/AudioEngine').then(m => ({ default: m.AudioEngine })));
const SynthCanvas = lazy(() => import('./modules/visual/SynthCanvas').then(m => ({ default: m.SynthCanvas })));

function App() {
  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', background: '#050510', overflow: 'hidden' }}>
        <Suspense fallback={null}>
          <HandTracker />
          <AudioEngine />
          <SynthCanvas />
        </Suspense>
        <LoadingScreen />
        <CameraOverlay />
      </div>
    </ErrorBoundary>
  );
}

export default App;
