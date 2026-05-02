import { Suspense, lazy } from 'react';

const HandTracker = lazy(() => import('./modules/vision/HandTracker'));
const AudioEngine = lazy(() => import('./modules/audio/AudioEngine'));
const SynthCanvas = lazy(() => import('./modules/visual/SynthCanvas'));

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
