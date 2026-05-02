import React from 'react';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from '@react-three/postprocessing';
import { Vector2 } from 'three';

const chromaticOffset = new Vector2(0.002, 0.002);

/**
 * PostEffects — Pipeline de post-procesamiento Synthwave.
 *
 * - Bloom: brillo neón en elementos emisivos (luminanceThreshold 0.6)
 * - ChromaticAberration: sutil separación cromática en bordes
 * - Vignette: oscurecimiento periférico para focalizar atención
 *
 * Debe montarse DENTRO del <Canvas> como hijo directo.
 */
export const PostEffects: React.FC = () => {
  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom
        intensity={1.5}
        luminanceThreshold={0.6}
        mipmapBlur
      />
      <ChromaticAberration
        offset={chromaticOffset}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette
        offset={0.3}
        darkness={0.7}
        eskil={false}
      />
    </EffectComposer>
  );
};
