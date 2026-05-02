export const SCALE: readonly string[] = [
  'C3', 'D3', 'Eb3', 'F3', 'G3', 'A3', 'Bb3',
  'C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4',
  'C5',
] as const;

export function midiNoteToName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = noteNames[midi % 12];
  return `${note}${octave}`;
}
