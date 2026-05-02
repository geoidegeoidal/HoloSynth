import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { RightHandData } from '../../types';

export function calculatePolarData(landmarks: NormalizedLandmark[]): RightHandData {
  // Centroide: Promedio de landmarks 0, 5, 9, 13, 17 (base de cada dedo + muñeca)
  const baseLandmarks = [0, 5, 9, 13, 17];
  
  let sumX = 0, sumY = 0, sumZ = 0;
  for (const idx of baseLandmarks) {
    sumX += landmarks[idx]!.x;
    sumY += landmarks[idx]!.y;
    sumZ += landmarks[idx]!.z;
  }
  
  const count = baseLandmarks.length;
  const centroid = {
    x: sumX / count,
    y: sumY / count,
    z: sumZ / count
  };

  const dx = centroid.x - 0.5;
  const dy = centroid.y - 0.5;
  
  const radius = Math.max(0, Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2));
  let angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

  return {
    isVisible: true,
    angle,
    radius,
    rawCentroid: centroid
  };
}
