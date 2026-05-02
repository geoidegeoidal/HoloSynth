import { create } from 'zustand';
import type { HoloSynthState, RightHandData, LeftHandGesture, CameraStatus, LooperState } from '../types';

const defaultRightHand: RightHandData = {
  isVisible: false,
  angle: 0,
  radius: 0,
  rawCentroid: { x: 0, y: 0, z: 0 },
};

export const useHoloStore = create<HoloSynthState>((set) => ({
  isReady: false,
  rightHand: defaultRightHand,
  leftHandGesture: 'none' as LeftHandGesture,
  cameraStatus: 'waiting' as CameraStatus,
  currentNote: '',
  looperState: 'idle' as LooperState,
  setRightHandData: (data) =>
    set((state) => ({
      rightHand: { ...state.rightHand, ...data },
    })),
  setLeftHandGesture: (gesture) => set({ leftHandGesture: gesture }),
  setReady: (status) => set({ isReady: status }),
  setCameraStatus: (status) => set({ cameraStatus: status }),
  setCurrentNote: (note) => set({ currentNote: note }),
  setLooperState: (state) => set({ looperState: state }),
}));

export const useAngle = () => useHoloStore((s) => s.rightHand.angle);
export const useRadius = () => useHoloStore((s) => s.rightHand.radius);
export const useGesture = () => useHoloStore((s) => s.leftHandGesture);
export const useIsReady = () => useHoloStore((s) => s.isReady);
export const useIsVisible = () => useHoloStore((s) => s.rightHand.isVisible);
export const useCameraStatus = () => useHoloStore((s) => s.cameraStatus);
export const useCurrentNote = () => useHoloStore((s) => s.currentNote);
export const useLooperState = () => useHoloStore((s) => s.looperState);