export interface HandCoordinates {
  x: number;
  y: number;
  z: number;
}

export interface RightHandData {
  isVisible: boolean;
  angle: number;
  radius: number;
  rawCentroid: HandCoordinates;
}

export type LeftHandGesture = 'none' | 'pinch' | 'open' | 'fist';

export interface HoloSynthState {
  isReady: boolean;
  rightHand: RightHandData;
  leftHandGesture: LeftHandGesture;
  setRightHandData: (data: Partial<RightHandData>) => void;
  setLeftHandGesture: (gesture: LeftHandGesture) => void;
  setReady: (status: boolean) => void;
}
