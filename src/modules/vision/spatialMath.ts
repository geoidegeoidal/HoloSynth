import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { RightHandData } from '../../types';

export function calculatePolarData(landmarks: NormalizedLandmark[]): RightHandData {
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

  // Horizontal position maps to note arc: left=low notes, right=high notes
  // Mirror X for front-facing camera (user's left = screen right)
  // Normalize to 0–360 range matching the visual arc
  const normalizedX = 1 - centroid.x; // mirror for front camera
  const angle = Math.max(0, Math.min(360, normalizedX * 360));

  // Radius = distance from center, controlling volume/filter
  const dx = centroid.x - 0.5;
  const dy = centroid.y - 0.5;
  const radius = Math.max(0, Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2));

  return {
    isVisible: true,
    angle,
    radius,
    rawCentroid: centroid
  };
}