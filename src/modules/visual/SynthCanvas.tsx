import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  HoloTorus,
  PositionIndicator,
  RetroGrid,
  ParticleField,
} from './components/SceneElements';
import { GestureEffects } from './components/GestureEffects';
import { PostEffects } from './PostEffects';

/**
 * SynthCanvas — Escena 3D principal con estética Synthwave/Holográfico.
 * Contiene el toroide central, indicador de posición, partículas,
 * grid retro, efectos de gestos y post-procesamiento.
 */
export const SynthCanvas: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(ellipse at center, #0a0a20 0%, #050510 70%)',
      }}
    >
      <Canvas
        camera={{ position: [0, 2, 7], fov: 60, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
      >
        {/* Iluminación */}
        <ambientLight intensity={0.15} color={0x8888ff} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color={0x00ffff} />
        <pointLight position={[-5, -3, 3]} intensity={0.4} color={0xff00ff} />

        {/* Escena */}
        <HoloTorus />
        <PositionIndicator />
        <RetroGrid />
        <ParticleField />
        <GestureEffects />

        {/* Post-procesamiento */}
        <PostEffects />

        {/* Controles de debug (removibles en producción) */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          enableZoom={false}
          enablePan={false}
        />
      </Canvas>
    </div>
  );
};
