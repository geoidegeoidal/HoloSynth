import React from 'react';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from '@react-three/postprocessing';
import { Vector2 } from 'three';


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
        intensity={2.5}
        luminanceThreshold={0.2}
        mipmapBlur
      />
      <ChromaticAberration
        offset={new Vector2(0.003, 0.003)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette
        offset={0.4}
        darkness={0.9}
        eskil={false}
      />
    </EffectComposer>
  );
};
