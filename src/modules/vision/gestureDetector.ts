import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { LeftHandGesture } from '../../types';

export function detectGesture(landmarks: NormalizedLandmark[]): LeftHandGesture {
  // Pinch
  const thumbTip = landmarks[4]!;
  const indexTip = landmarks[8]!;
  
  const dx = thumbTip.x - indexTip.x;
  const dy = thumbTip.y - indexTip.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < 0.05) {
    return 'pinch';
  }

  // Fist / Open
  const fingerTips = [8, 12, 16, 20];
  const fingerMcp = [5, 9, 13, 17];
  
  let allBelow = true;
  let allAbove = true;
  
  for (let i = 0; i < 4; i++) {
    const tipIdx = fingerTips[i]!;
    const mcpIdx = fingerMcp[i]!;
    // En MediaPipe, el eje Y va de 0 (arriba) a 1 (abajo)
    // "Por debajo" significa que la coordenada Y es mayor que el MCP
    // "Por encima" significa que la coordenada Y es menor que el MCP
    if (landmarks[tipIdx]!.y < landmarks[mcpIdx]!.y) {
      allBelow = false;
    }
    if (landmarks[tipIdx]!.y > landmarks[mcpIdx]!.y) {
      allAbove = false;
    }
  }

  if (allBelow) return 'fist';
  if (allAbove) return 'open';

  return 'none';
}
