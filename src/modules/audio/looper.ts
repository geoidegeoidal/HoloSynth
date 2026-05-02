export function getWaveformData(): Float32Array {
  return new Float32Array(256);
}

export interface LoopEvent {
  time: number;
  note: string;
}

let recordBuffer: LoopEvent[] = [];

export function getRecordBuffer(): LoopEvent[] {
  return recordBuffer;
}

export function getLoopDuration(): number {
  if (recordBuffer.length === 0) return 1;
  return recordBuffer[recordBuffer.length - 1]!.time;
}

export function recordNote(note: string, time: number): void {
  recordBuffer.push({ time, note });
}

export function clearRecordBuffer(): void {
  recordBuffer = [];
}
