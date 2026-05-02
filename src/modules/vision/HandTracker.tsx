import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { initializeHandLandmarker, startTracking } from './handLandmarker';
import { calculatePolarData } from './spatialMath';
import { detectGesture } from './gestureDetector';
import { useHoloStore } from '../../store/useHoloStore';
import type { LeftHandGesture } from '../../types';

export interface HandTrackerHandle {
  getVideoElement: () => HTMLVideoElement | null;
}

export const HandTracker = forwardRef<HandTrackerHandle>((_props, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const gestureHistoryRef = useRef<LeftHandGesture[]>([]);

  useImperativeHandle(ref, () => ({
    getVideoElement: () => videoRef.current,
  }));

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let stopTracking: (() => void) | undefined;
    let isComponentMounted = true;

    const setupCameraAndVision = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 }
        });
        
        if (!isComponentMounted) return;
        
        useHoloStore.getState().setCameraStatus('active');
        
        video.srcObject = stream;
        
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            video.play();
            resolve();
          };
        });

        await initializeHandLandmarker();

        if (!isComponentMounted) return;

        useHoloStore.getState().setReady(true);

        stopTracking = startTracking(video, (results) => {
          if (!results.landmarks) return;

          let rightHandFound = false;
          let leftHandFound = false;

          for (let i = 0; i < results.landmarks.length; i++) {
            const landmarks = results.landmarks[i]!;
            const handednessInfo = results.handednesses[i];
            const handedness = handednessInfo ? handednessInfo[0]!.categoryName : 'Left';
            
            const isUserRightHand = handedness === 'Left';
            
            if (isUserRightHand) {
              rightHandFound = true;
              const polarData = calculatePolarData(landmarks);
              useHoloStore.getState().setRightHandData(polarData);
            } else {
              leftHandFound = true;
              const gesture = detectGesture(landmarks);
              
              const history = gestureHistoryRef.current;
              history.push(gesture);
              if (history.length > 3) history.shift();
              
              if (history.length === 3 && history.every(g => g === gesture)) {
                useHoloStore.getState().setLeftHandGesture(gesture);
              }
            }
          }

          if (!rightHandFound && useHoloStore.getState().rightHand.isVisible) {
            useHoloStore.getState().setRightHandData({ isVisible: false });
          }
          if (!leftHandFound && useHoloStore.getState().leftHandGesture !== 'none') {
             useHoloStore.getState().setLeftHandGesture('none');
             gestureHistoryRef.current = [];
          }
        });
      } catch (err) {
        console.error("Error initializing HandTracker:", err);
        const isDenied =
          err instanceof DOMException &&
          (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
        useHoloStore.getState().setCameraStatus(isDenied ? 'denied' : 'error');
        useHoloStore.getState().setReady(true);
      }
    };

    setupCameraAndVision();

    return () => {
      isComponentMounted = false;
      if (stopTracking) stopTracking();
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      style={{ display: 'none' }}
      playsInline
      muted
    />
  );
});