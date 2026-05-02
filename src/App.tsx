import { Suspense, lazy } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';
import { HoloHUD } from './components/HoloHUD';
import { MinilabUI } from './components/minilab/MinilabUI';
import { useMidiController } from './hooks/useMidiController';

const AudioEngine = lazy(() => import('./modules/audio/AudioEngine').then(m => ({ default: m.AudioEngine })));
const SynthCanvas = lazy(() => import('./modules/visual/SynthCanvas').then(m => ({ default: m.SynthCanvas })));

function AppContent() {
  useMidiController();

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050510', overflow: 'hidden' }}>
      <Suspense fallback={null}>
        <AudioEngine />
        <SynthCanvas />
      </Suspense>
      <LoadingScreen />
      <HoloHUD />
      <MinilabUI />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
