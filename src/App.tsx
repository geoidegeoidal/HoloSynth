import { Suspense, lazy } from 'react';

const HandTracker = lazy(() => import('./modules/vision/HandTracker').then(m => ({ default: m.HandTracker })));
const AudioEngine = lazy(() => import('./modules/audio/AudioEngine').then(m => ({ default: m.AudioEngine })));
const SynthCanvas = lazy(() => import('./modules/visual/SynthCanvas').then(m => ({ default: m.SynthCanvas })));

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050510', overflow: 'hidden' }}>
      <Suspense fallback={<div style={{ color: '#fff', textAlign: 'center', paddingTop: '40vh' }}>Loading HoloSynth...</div>}>
        <HandTracker />
        <AudioEngine />
        <SynthCanvas />
      </Suspense>
    </div>
  );
}

export default App;
