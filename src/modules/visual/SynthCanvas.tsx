import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  HoloTorus,
  RetroGrid,
  ParticleField,
} from './components/SceneElements';
import { PostEffects } from './PostEffects';

/**
 * SynthCanvas — Escena 3D principal con estética Cyberpunk/Holográfica.
 * Actualizado a Fondo Deep Dark Blue para igualar el banner generado.
 */
export const SynthCanvas: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        // Fondo "Deep Dark Blue" a casi negro absoluto.
        background: 'radial-gradient(circle at center, #010410 0%, #000002 80%)',
        zIndex: 0,
      }}
    >
      <Canvas
        camera={{ position: [0, 2, 8], fov: 55, near: 0.1, far: 150 }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      >
        {/* Iluminación cinematográfica */}
        <ambientLight intensity={0.1} color={0x111144} />
        <pointLight position={[5, 5, 5]} intensity={1.5} color={0x00ffff} />
        <pointLight position={[-5, -3, 3]} intensity={1.0} color={0xff00ff} />
        <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={2} color={0x4444ff} />

        {/* Elementos Estéticos */}
        <HoloTorus />
        <RetroGrid />
        <ParticleField />

        {/* Efectos de Post-procesado (Bloom Agresivo, Vignette) */}
        <PostEffects />

        {/* Controles sutiles para orbitar el holograma, si el mouse no está sobre la UI */}
        <OrbitControls
          enableDamping
          dampingFactor={0.04}
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};
