import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGesture } from '../../../store/useHoloStore';

/**
 * Componente de efectos reactivos a gestos de la mano izquierda.
 *
 * - `pinch` → Flash visual (pulso de emisión intensa en una esfera envolvente)
 * - `fist`  → Overlay de desaturación (mesh semitransparente gris)
 */
export const GestureEffects: React.FC = () => {
  const gesture = useGesture();

  const flashMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 0,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [],
  );

  const desatMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x222222),
        transparent: true,
        opacity: 0,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [],
  );

  useFrame(() => {
    // Flash de pinch
    const flashTarget = gesture === 'pinch' ? 0.25 : 0;
    flashMaterial.opacity = THREE.MathUtils.lerp(
      flashMaterial.opacity,
      flashTarget,
      0.15,
    );

    // Desaturación de fist
    const desatTarget = gesture === 'fist' ? 0.35 : 0;
    desatMaterial.opacity = THREE.MathUtils.lerp(
      desatMaterial.opacity,
      desatTarget,
      0.08,
    );
  });

  return (
    <>
      {/* Flash sphere */}
      <mesh material={flashMaterial}>
        <sphereGeometry args={[8, 16, 16]} />
      </mesh>
      {/* Desaturation overlay */}
      <mesh material={desatMaterial}>
        <sphereGeometry args={[9, 16, 16]} />
      </mesh>
    </>
  );
};
