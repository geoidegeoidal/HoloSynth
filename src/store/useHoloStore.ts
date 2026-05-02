import { create } from 'zustand';
import type { HoloSynthState, RightHandData, LeftHandGesture } from '../types';

const defaultRightHand: RightHandData = {
  isVisible: false,
  angle: 0,
  radius: 0,
  rawCentroid: { x: 0, y: 0, z: 0 },
};

const defaultGesture: LeftHandGesture = 'none';

export const useHoloStore = create<HoloSynthState>((set) => ({
  isReady: false,
  rightHand: defaultRightHand,
  leftHandGesture: defaultGesture,
  setRightHandData: (data) =>
    set((state) => ({
      rightHand: { ...state.rightHand, ...data },
    })),
  setLeftHandGesture: (gesture) => set({ leftHandGesture: gesture }),
  setReady: (status) => set({ isReady: status }),
}));

export const useAngle = () => useHoloStore((s) => s.rightHand.angle);
export const useRadius = () => useHoloStore((s) => s.rightHand.radius);
export const useGesture = () => useHoloStore((s) => s.leftHandGesture);
export const useIsReady = () => useHoloStore((s) => s.isReady);
export const useIsVisible = () => useHoloStore((s) => s.rightHand.isVisible);
