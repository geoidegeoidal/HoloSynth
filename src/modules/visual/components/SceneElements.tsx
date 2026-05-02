import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { engine } from '../../audio/minilabEngine';
import { useSynthStore } from '../../../store/useSynthStore';

/**
 * HoloTorus — El núcleo visual reactivo.
 * Ahora consta de un núcleo emisivo y múltiples anillos wireframe,
 * emulando un artefacto holográfico complejo. Reacciona al audio real.
 */
export const HoloTorus: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const coreMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Obtener nivel de audio en dB (-100 a 0 aprox)
    const levelDb = engine.meter.getValue();
    const audioLevel = Array.isArray(levelDb) ? levelDb[0] : levelDb;
    // Normalizar de 0 a 1 (asumiendo piso de -60dB)
    const normalizedAudio = Math.pow(Math.max(0, (audioLevel + 60) / 60), 2);

    // Obtener parámetros del sintetizador para influir en el visual
    const { knobs, activeNotes } = useSynthStore.getState();
    const isPlaying = activeNotes.size > 0;

    // Rotación base afectada por LFO Rate
    const rotSpeed = 0.1 + knobs.lfoRate * 2.0;
    group.rotation.x += delta * rotSpeed * 0.5;
    group.rotation.y += delta * rotSpeed;

    // Los anillos exteriores giran en direcciones opuestas
    group.children[1].rotation.x -= delta * 0.5;
    group.children[2].rotation.y -= delta * 0.8;
    group.children[3].rotation.z += delta * 1.2;

    const materialCore = coreMaterialRef.current;
    if (materialCore) {
      const targetIntensity = isPlaying ? 2.0 + normalizedAudio * 5.0 : 0.5 + normalizedAudio * 2.0;
      materialCore.emissiveIntensity = THREE.MathUtils.lerp(materialCore.emissiveIntensity, targetIntensity, 0.2);
      
      const hue = THREE.MathUtils.lerp(0.5, 0.85, knobs.resonance + normalizedAudio * 0.2);
      materialCore.emissive.setHSL(hue, 1.0, 0.5);
    }

    // Escala pulsante con el audio
    const scaleTarget = 1.0 + normalizedAudio * 0.3 + knobs.drive * 0.2;
    group.scale.lerp(new THREE.Vector3(scaleTarget, scaleTarget, scaleTarget), 0.15);
  });

  return (
    <group ref={groupRef}>
      {/* Núcleo Sólido */}
      <mesh>
        <torusGeometry args={[1.8, 0.25, 64, 100]} />
        <meshStandardMaterial ref={coreMaterialRef} color={0x00ffff} emissive={0x00ffff} emissiveIntensity={1.0} metalness={0.8} roughness={0.1} transparent opacity={0.9} />
      </mesh>
      {/* Anillos Wireframe */}
      <mesh>
        <torusGeometry args={[2.2, 0.05, 16, 64]} />
        <meshBasicMaterial color={0xff00ff} wireframe transparent opacity={0.3} />
      </mesh>
      <mesh>
        <torusGeometry args={[2.5, 0.02, 8, 50]} />
        <meshBasicMaterial color={0xff00ff} wireframe transparent opacity={0.3} />
      </mesh>
      <mesh>
        <torusGeometry args={[2.8, 0.08, 4, 30]} />
        <meshBasicMaterial color={0xff00ff} wireframe transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

/**
 * Campo de partículas flotantes dual-color.
 */
export const ParticleField: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);

  const [{ positions, colors, count }] = useState(() => {
    const n = 1200;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    
    const cyan = new THREE.Color(0x00ffff);
    const magenta = new THREE.Color(0xff00ff);

    for (let i = 0; i < n; i++) {
      // Posición
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;

      // Color alternado
      const color = Math.random() > 0.5 ? cyan : magenta;
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return { positions: pos, colors: col, count: n };
  });

  useFrame((_state, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    
    // El LFO afecta la turbulencia espacial
    const { knobs } = useSynthStore.getState();
    pts.rotation.y += delta * (0.02 + knobs.lfoRate * 0.05);
    pts.rotation.x += delta * 0.01;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

/**
 * RetroGrid adaptado a Deep Blue / Magenta neon.
 */
export const RetroGrid: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    
    // El Cutoff del filtro afecta la velocidad de viaje virtual
    const { knobs } = useSynthStore.getState();
    const speed = 0.1 + knobs.cutoff * 0.8;

    const mat = mesh.material as THREE.MeshBasicMaterial;
    if (mat.map) {
      mat.map.offset.y -= delta * speed;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
      <planeGeometry args={[60, 60, 40, 40]} />
      <meshBasicMaterial
        color={0xff00ff}
        wireframe
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};
