import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { HandLandmarkerResult } from '@mediapipe/tasks-vision';

let handLandmarker: HandLandmarker | null = null;

export async function initializeHandLandmarker() {
  if (handLandmarker) return handLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.7
  });

  return handLandmarker;
}

export function startTracking(
  videoEl: HTMLVideoElement, 
  onResults: (results: HandLandmarkerResult) => void
) {
  let lastVideoTime = -1;
  let animationFrameId: number;

  const detect = () => {
    if (!handLandmarker) {
      animationFrameId = requestAnimationFrame(detect);
      return;
    }

    const startTimeMs = performance.now();
    if (videoEl.currentTime !== lastVideoTime && videoEl.readyState >= 2) {
      lastVideoTime = videoEl.currentTime;
      const results = handLandmarker.detectForVideo(videoEl, startTimeMs);
      onResults(results);
    }
    animationFrameId = requestAnimationFrame(detect);
  };

  detect();

  return () => {
    cancelAnimationFrame(animationFrameId);
  };
}
