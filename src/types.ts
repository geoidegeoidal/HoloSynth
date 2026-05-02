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

export type CameraStatus = 'waiting' | 'active' | 'error' | 'denied';

export type LooperState = 'idle' | 'recording' | 'playing' | 'muted';

export interface HoloSynthState {
  isReady: boolean;
  rightHand: RightHandData;
  leftHandGesture: LeftHandGesture;
  cameraStatus: CameraStatus;
  currentNote: string;
  looperState: LooperState;
  setRightHandData: (data: Partial<RightHandData>) => void;
  setLeftHandGesture: (gesture: LeftHandGesture) => void;
  setReady: (status: boolean) => void;
  setCameraStatus: (status: CameraStatus) => void;
  setCurrentNote: (note: string) => void;
  setLooperState: (state: LooperState) => void;
}