import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useActiveNotes } from '../../../store/useSynthStore';

export const HoloTorus: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const activeNotes = useActiveNotes();
  const hasActiveNotes = activeNotes.size > 0;

  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
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

  useEffect(() => {
    materialRef.current = material;
  }, [material]);

  const elapsedRef = useRef(0);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    const mat = materialRef.current;
    if (!mesh || !mat) return;

    elapsedRef.current += delta;

    mesh.rotation.x += delta * 0.15;
    mesh.rotation.y += delta * 0.25;

    const pulse = hasActiveNotes ? 1.5 + Math.sin(elapsedRef.current * 6) * 0.8 : 0.3;
    const targetIntensity = 0.3 + pulse;
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      targetIntensity,
      0.1,
    );

    const hue = hasActiveNotes
      ? THREE.MathUtils.lerp(0.5, 0.85, 0.5 + Math.sin(elapsedRef.current * 3) * 0.5)
      : 0.5;
    mat.emissive.setHSL(hue, 1.0, 0.5);

    const targetOpacity = hasActiveNotes ? 1.0 : 0.4;
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.08);
  });

  return (
    <mesh ref={meshRef} material={material}>
      <torusGeometry args={[1.8, 0.15, 32, 100]} />
    </mesh>
  );
};

export const RetroGrid: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
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

const generateParticlePositions = (n: number): Float32Array => {
  const pos = new Float32Array(n * 3);
  const seed = 42;
  let s = seed;
  const pseudoRandom = (): number => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (pseudoRandom() - 0.5) * 20;
    pos[i * 3 + 1] = (pseudoRandom() - 0.5) * 12;
    pos[i * 3 + 2] = (pseudoRandom() - 0.5) * 20;
  }
  return pos;
};

export const ParticleField: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, count } = useMemo(() => {
    const n = 600;
    const pos = generateParticlePositions(n);
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
