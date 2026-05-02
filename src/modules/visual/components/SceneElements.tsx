import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAngle, useRadius, useIsVisible } from '../../../store/useHoloStore';

/**
 * Toroide central emisivo cyan/magenta con brillo reactivo al radius.
 */
export const HoloTorus: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const radius = useRadius();
  const isVisible = useIsVisible();

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x00ffff),
        emissive: new THREE.Color(0x00ffff),
        emissiveIntensity: 0.3,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 1.0,
      }),
    [],
  );

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Rotación idle
    mesh.rotation.x += delta * 0.15;
    mesh.rotation.y += delta * 0.25;

    // Intensidad de emisión reactiva al radius
    const targetIntensity = isVisible ? 0.3 + radius * 2.5 : 0.3;
    material.emissiveIntensity = THREE.MathUtils.lerp(
      material.emissiveIntensity,
      targetIntensity,
      0.1,
    );

    // Shift de color: cyan → magenta con radius
    const hue = THREE.MathUtils.lerp(0.5, 0.85, radius);
    material.emissive.setHSL(hue, 1.0, 0.5);

    // Opacidad general cuando la mano es visible
    const targetOpacity = isVisible ? 1.0 : 0.4;
    material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.08);
  });

  return (
    <mesh ref={meshRef} material={material}>
      <torusGeometry args={[1.8, 0.15, 32, 100]} />
    </mesh>
  );
};

/**
 * Esfera indicadora que orbita el toroide siguiendo angle/radius del store.
 */
export const PositionIndicator: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const angle = useAngle();
  const radius = useRadius();
  const isVisible = useIsVisible();

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(0xff00ff),
        emissive: new THREE.Color(0xff00ff),
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 1.0,
      }),
    [],
  );

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const rad = (angle * Math.PI) / 180;
    const orbitRadius = 1.8 + radius * 0.8;

    mesh.position.x = Math.cos(rad) * orbitRadius;
    mesh.position.y = Math.sin(rad) * orbitRadius;
    mesh.position.z = 0;

    // Escala reactiva al radius
    const scale = 0.08 + radius * 0.18;
    mesh.scale.setScalar(scale);

    // Opacidad
    const targetOpacity = isVisible ? 1.0 : 0.0;
    material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.12);
  });

  return (
    <mesh ref={meshRef} material={material}>
      <sphereGeometry args={[1, 24, 24]} />
    </mesh>
  );
};

/**
 * Grid de suelo retro-synthwave.
 */
export const RetroGrid: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    // Scroll sutil del grid
    const mat = mesh.material as THREE.MeshBasicMaterial;
    if (mat.map) {
      mat.map.offset.y -= delta * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
      <planeGeometry args={[40, 40, 40, 40]} />
      <meshBasicMaterial
        color={0x00ffaa}
        wireframe
        transparent
        opacity={0.12}
      />
    </mesh>
  );
};

/**
 * Campo de partículas ambientales flotantes.
 */
export const ParticleField: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, count } = useMemo(() => {
    const n = 600;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return { positions: pos, count: n };
  }, []);

  useFrame((_state, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    pts.rotation.y += delta * 0.02;
    pts.rotation.x += delta * 0.005;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={0x8844ff}
        size={0.04}
        sizeAttenuation
        transparent
        opacity={0.6}
      />
    </points>
  );
};
